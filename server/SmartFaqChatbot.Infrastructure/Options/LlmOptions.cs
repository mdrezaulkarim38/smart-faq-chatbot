namespace SmartFaqChatbot.Infrastructure.Options;

public class LlmOptions
{
    public const string SectionName = "LLM";

    public string Endpoint { get; set; } = "http://localhost:11434";
    public string Model { get; set; } = "qwen3:8b";
    public string? ApiKey { get; set; }
    public int MaxTurns { get; set; } = 10;
}
