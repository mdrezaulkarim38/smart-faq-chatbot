using System.Text.Json.Serialization;
using SmartFaqChatbot.Core.Entities;

namespace SmartFaqChatbot.Api.DTOs;

public class SessionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public static class DtoMappings
{
    public static SessionDto ToDto(this ChatSession session) => new()
    {
        Id = session.Id,
        Title = session.Title,
        CreatedAt = session.CreatedAt,
        UpdatedAt = session.UpdatedAt
    };

    public static MessageDto ToDto(this ChatMessage message) => new()
    {
        Id = message.Id,
        SessionId = message.SessionId,
        Role = message.Role,
        Content = message.Content,
        Timestamp = message.Timestamp
    };
}
