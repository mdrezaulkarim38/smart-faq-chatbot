namespace SmartFaqChatbot.Core.DTOs;

public class ChatResponse
{
    public Guid SessionId { get; set; }
    public string Content { get; set; } = string.Empty;
}