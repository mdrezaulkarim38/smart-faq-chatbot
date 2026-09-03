using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartFaqChatbot.Core.Interfaces;
using SmartFaqChatbot.Infrastructure.Data;
using SmartFaqChatbot.Infrastructure.Options;
using SmartFaqChatbot.Infrastructure.Services;

namespace SmartFaqChatbot.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Data Source=chatbot.db";

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(connectionString));

        services.Configure<LlmOptions>(configuration.GetSection(LlmOptions.SectionName));

        services.AddHttpClient<IChatService, OllamaChatService>((sp, client) =>
        {
            var llm = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<LlmOptions>>().Value;
            client.BaseAddress = new Uri(llm.Endpoint);
            client.Timeout = TimeSpan.FromMinutes(3);
            if (!string.IsNullOrWhiteSpace(llm.ApiKey))
            {
                client.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", llm.ApiKey);
            }
        }).AddStandardResilienceHandler(options =>
        {
            options.TotalRequestTimeout.Timeout = TimeSpan.FromMinutes(3);
            options.AttemptTimeout.Timeout = TimeSpan.FromSeconds(60);
            options.Retry.MaxRetryAttempts = 2;
            options.Retry.UseJitter = true;
            options.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(150);
        });

        return services;
    }
}
