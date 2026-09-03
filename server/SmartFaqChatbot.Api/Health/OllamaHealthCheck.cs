using Microsoft.Extensions.Diagnostics.HealthChecks;
using SmartFaqChatbot.Infrastructure.Options;

namespace SmartFaqChatbot.Api.Health;

public class OllamaHealthCheck : IHealthCheck
{
    private readonly HttpClient _http;
    private readonly LlmOptions _llm;

    public OllamaHealthCheck(IHttpClientFactory httpClientFactory, Microsoft.Extensions.Options.IOptions<LlmOptions> options)
    {
        _http = httpClientFactory.CreateClient();
        _llm = options.Value;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _http.GetAsync(
                $"{_llm.Endpoint}/api/tags",
                cancellationToken);

            if (response.IsSuccessStatusCode)
                return HealthCheckResult.Healthy("Ollama is reachable.");

            return HealthCheckResult.Unhealthy($"Ollama returned {response.StatusCode}.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Ollama is not reachable.", ex);
        }
    }
}
