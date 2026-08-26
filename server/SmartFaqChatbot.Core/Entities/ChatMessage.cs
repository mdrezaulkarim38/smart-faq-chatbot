namespace SmartFaqChatbot.Core.Entities;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SessionId { get; set; }
    public ChatSession Session { get; set; } = null!;
    public string Role { get; set; } = string.Empty; // ""user" | "assistant" | "system"
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}