using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using SmartFaqChatbot.Core.DTOs;
using SmartFaqChatbot.Core.Entities;
using SmartFaqChatbot.Core.Interfaces;
using SmartFaqChatbot.Infrastructure.Data;
using SmartFaqChatbot.Infrastructure.Options;
using ChatMessageContent = SmartFaqChatbot.Core.DTOs.ChatMessageContent;

namespace SmartFaqChatbot.Infrastructure.Services;

public class OllamaChatService : IChatService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly AppDbContext _db;
    private readonly HttpClient _http;
    private readonly LlmOptions _llm;
    private readonly ILogger<OllamaChatService> _logger;

    public OllamaChatService(
        AppDbContext db,
        HttpClient http,
        IOptions<LlmOptions> llmOptions,
        ILogger<OllamaChatService> logger)
    {
        _db = db;
        _http = http;
        _llm = llmOptions.Value;
        _logger = logger;
    }

    public async Task<ChatResponse> SendMessageAsync(ChatRequest request, CancellationToken ct = default)
    {
        var session = await GetOrCreateSessionAsync(request.SessionId, request.Content, ct);

        _db.Messages.Add(new ChatMessage
        {
            SessionId = session.Id,
            Role = "user",
            Content = request.Content,
            Timestamp = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        var history = await LoadTruncatedHistoryAsync(session.Id, ct);
        var reply = await CompleteAsync(history, ct);

        _db.Messages.Add(new ChatMessage
        {
            SessionId = session.Id,
            Role = "assistant",
            Content = reply,
            Timestamp = DateTime.UtcNow
        });
        session.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new ChatResponse { SessionId = session.Id, Content = reply };
    }

    public async IAsyncEnumerable<ChatMessageContent> SendMessageStreamAsync(
        ChatRequest request,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var session = await GetOrCreateSessionAsync(request.SessionId, request.Content, ct);

        _db.Messages.Add(new ChatMessage
        {
            SessionId = session.Id,
            Role = "user",
            Content = request.Content,
            Timestamp = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);

        var history = await LoadTruncatedHistoryAsync(session.Id, ct);

        var buffer = new System.Text.StringBuilder();
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var tokenCount = 0;

        var payload = BuildPayload(history, stream: true);
        var response = await _http.PostAsync(
            $"{_llm.Endpoint}/v1/chat/completions",
            JsonContent.Create(payload, options: JsonOptions),
            ct);

        response.EnsureSuccessStatusCode();

        try
        {
            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var reader = new StreamReader(stream);

            string? line;
            while ((line = await reader.ReadLineAsync(ct)) is not null)
            {
                ct.ThrowIfCancellationRequested();
                if (!line.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                    continue;

                var data = line.AsSpan(5).Trim().ToString();
                if (data == "[DONE]")
                    break;

                using var doc = JsonDocument.Parse(data);
                if (!doc.RootElement.TryGetProperty("choices", out var choices) ||
                    choices.GetArrayLength() == 0)
                    continue;

                var delta = choices[0].GetProperty("delta");
                if (delta.TryGetProperty("content", out var content))
                {
                    var token = content.GetString() ?? string.Empty;
                    if (token.Length == 0)
                        continue;

                    buffer.Append(token);
                    tokenCount++;
                    yield return new ChatMessageContent
                    {
                        Role = "assistant",
                        Content = token,
                        Done = false
                    };
                }
            }
        }
        finally
        {
            if (buffer.Length > 0)
            {
                _db.Messages.Add(new ChatMessage
                {
                    SessionId = session.Id,
                    Role = "assistant",
                    Content = buffer.ToString(),
                    Timestamp = DateTime.UtcNow
                });
                session.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);

                _logger.LogInformation(
                    "Reply generated: SessionId={SessionId} Tokens={Tokens} in {ElapsedMs} ms",
                    session.Id, tokenCount, sw.ElapsedMilliseconds);
            }
        }

        yield return new ChatMessageContent
        {
            Role = "assistant",
            Content = string.Empty,
            Done = true
        };
    }

    public async Task<List<ChatSession>> GetSessionsAsync(CancellationToken ct = default)
    {
        return await _db.Sessions
            .AsNoTracking()
            .OrderByDescending(s => s.UpdatedAt)
            .Select(s => new ChatSession
            {
                Id = s.Id,
                Title = s.Title,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt,
                Messages = new List<ChatMessage>()
            })
            .ToListAsync(ct);
    }

    public async Task<ChatSession?> GetSessionAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Sessions
            .AsNoTracking()
            .Include(s => s.Messages)
            .FirstOrDefaultAsync(s => s.Id == id, ct);
    }

    public async Task<ChatSession> CreateSessionAsync(string title, CancellationToken ct = default)
    {
        var session = new ChatSession { Title = title };
        _db.Sessions.Add(session);
        await _db.SaveChangesAsync(ct);
        return session;
    }

    public async Task DeleteSessionAsync(Guid id, CancellationToken ct = default)
    {
        var session = await _db.Sessions
            .FirstOrDefaultAsync(s => s.Id == id, ct);
        if (session is not null)
        {
            _db.Sessions.Remove(session);
            await _db.SaveChangesAsync(ct);
        }
    }

    private async Task<ChatSession> GetOrCreateSessionAsync(
        Guid? sessionId,
        string firstMessage,
        CancellationToken ct)
    {
        if (sessionId is Guid id)
        {
            var existing = await _db.Sessions.FirstOrDefaultAsync(s => s.Id == id, ct);
            if (existing is not null)
            {
                existing.UpdatedAt = DateTime.UtcNow;
                return existing;
            }
        }

        var session = new ChatSession
        {
            Title = MakeTitle(firstMessage)
        };
        _db.Sessions.Add(session);
        await _db.SaveChangesAsync(ct);
        return session;
    }

    private async Task<ChatHistory> LoadTruncatedHistoryAsync(Guid sessionId, CancellationToken ct)
    {
        var messages = await _db.Messages
            .AsNoTracking()
            .Where(m => m.SessionId == sessionId)
            .OrderBy(m => m.Timestamp)
            .Select(m => new { m.Role, m.Content })
            .ToListAsync(ct);

        var history = new ChatHistory();
        history.AddSystemMessage(SystemPrompt);

        var lastNTurns = messages
            .Where(m => m.Role is "user" or "assistant")
            .TakeLast(_llm.MaxTurns * 2)
            .ToList();

        foreach (var m in lastNTurns)
        {
            if (m.Role == "user")
                history.AddUserMessage(m.Content);
            else if (m.Role == "assistant")
                history.AddAssistantMessage(m.Content);
        }

        return history;
    }

    private async Task<string> CompleteAsync(ChatHistory history, CancellationToken ct)
    {
        var payload = BuildPayload(history, stream: false);
        var response = await _http.PostAsync(
            $"{_llm.Endpoint}/v1/chat/completions",
            JsonContent.Create(payload, options: JsonOptions),
            ct);

        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? string.Empty;
    }

    private object BuildPayload(ChatHistory history, bool stream)
    {
        var messages = history.Select(m =>
        {
            string role;
            var r = m.Role;
            if (r == AuthorRole.System)
                role = "system";
            else if (r == AuthorRole.Assistant)
                role = "assistant";
            else
                role = "user";
            return new { role, content = m.Content };
        }).ToList();

        return new
        {
            model = _llm.Model,
            messages,
            stream,
            temperature = (double?)0.7
        };
    }

    private static string MakeTitle(string message)
    {
        var normalized = message.Trim();
        return normalized.Length <= 60
            ? normalized
            : normalized[..60] + "…";
    }

    private static string SystemPrompt =>
        "You are a helpful FAQ assistant. Answer concisely and accurately using only the " +
        "conversation context. If you do not know the answer, say so honestly.";
}
