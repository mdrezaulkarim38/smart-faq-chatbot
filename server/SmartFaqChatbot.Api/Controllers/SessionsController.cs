using Microsoft.AspNetCore.Mvc;
using SmartFaqChatbot.Api.DTOs;
using SmartFaqChatbot.Core.Interfaces;

namespace SmartFaqChatbot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionsController : ControllerBase
{
    private readonly IChatService _chatService;

    public SessionsController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpGet]
    public async Task<IActionResult> ListAsync(CancellationToken ct)
    {
        var sessions = await _chatService.GetSessionsAsync(ct);
        return Ok(sessions.Select(s => s.ToDto()));
    }

    [HttpGet("{id:guid}/messages")]
    public async Task<IActionResult> GetMessagesAsync(Guid id, CancellationToken ct)
    {
        var session = await _chatService.GetSessionAsync(id, ct);
        if (session is null)
            return NotFound();

        return Ok(session.Messages.Select(m => m.ToDto()));
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CreateSessionRequest request, CancellationToken ct)
    {
        var title = string.IsNullOrWhiteSpace(request.Title) ? "New chat" : request.Title;
        var session = await _chatService.CreateSessionAsync(title, ct);
        return CreatedAtAction(nameof(GetMessagesAsync), new { id = session.Id }, session.ToDto());
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAsync(Guid id, CancellationToken ct)
    {
        await _chatService.DeleteSessionAsync(id, ct);
        return NoContent();
    }

    public record CreateSessionRequest(string? Title);
}
