using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using SmartFaqChatbot.Core.DTOs;
using SmartFaqChatbot.Core.Interfaces;

namespace SmartFaqChatbot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private static readonly JsonSerializerOptions SseJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> SendAsync(ChatRequest request, CancellationToken ct)
    {
        _logger.LogInformation("Chat message received: SessionId={SessionId}", request.SessionId);
        var response = await _chatService.SendMessageAsync(request, ct);
        return Ok(response);
    }

    [HttpPost("stream")]
    public async Task StreamAsync(ChatRequest request, CancellationToken ct)
    {
        Response.Headers.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers["Connection"] = "keep-alive";

        await foreach (var chunk in _chatService.SendMessageStreamAsync(request, ct))
        {
            if (Response.HasStarted is false)
                await Response.StartAsync(ct);

            var json = JsonSerializer.Serialize(chunk, SseJsonOptions);
            await Response.WriteAsync($"data: {json}\n\n", ct);
            await Response.Body.FlushAsync(ct);
        }
    }
}
