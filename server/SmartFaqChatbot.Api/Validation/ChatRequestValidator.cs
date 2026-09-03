using FluentValidation;

namespace SmartFaqChatbot.Api.Validation;

public class ChatRequestValidator : AbstractValidator<SmartFaqChatbot.Core.DTOs.ChatRequest>
{
    public ChatRequestValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty()
            .WithMessage("Message content is required.")
            .MaximumLength(10000)
            .WithMessage("Message content must not exceed 10,000 characters.");
    }
}
