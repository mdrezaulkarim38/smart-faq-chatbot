namespace SmartFaqChatbot.Core.DTOs;

public class ChatRequest
{
    public Guid? SessionId { get; set; }
    public string Content { get; set; } = string.Empty;
}