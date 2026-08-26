using SmartFaqChatbot.Core.DTOs;
using SmartFaqChatbot.Core.Entities;

namespace SmartFaqChatbot.Core.Interfaces;

public interface IChatService
{
    Task<ChatResponse> SendMessageAsync(ChatRequest request, CancellationToken ct = default);
    IAsyncEnumerable<ChatMessageContent> SendMessageStreamAsync(ChatRequest request, CancellationToken ct = default);
    Task<List<ChatSession>> GetSessionsAsync(CancellationToken ct = default);
    Task<ChatSession?> GetSessionAsync(Guid id, CancellationToken ct = default);
    Task<ChatSession> CreateSessionAsync(string title, CancellationToken ct = default);
    Task DeleteSessionAsync(Guid id, CancellationToken ct = default);
}