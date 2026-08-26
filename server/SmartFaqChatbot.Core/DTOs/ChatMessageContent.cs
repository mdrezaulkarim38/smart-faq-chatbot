namespace SmartFaqChatbot.Core.DTOs;

public class ChatMessageContent
{
    public string Role { get; set; } = string.Empty; // "assistant"
    public string Content { get; set; } = string.Empty;
    public bool Done { get; set; }
}