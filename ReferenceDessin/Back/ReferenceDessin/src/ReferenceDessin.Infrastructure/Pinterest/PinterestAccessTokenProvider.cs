using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Microsoft.Extensions.Options;

namespace ReferenceDessin.Infrastructure.Pinterest;

public sealed class PinterestAccessTokenProvider(
    IHttpClientFactory httpClientFactory,
    IOptions<PinterestOptions> options,
    TimeProvider timeProvider)
{
    public const string HttpClientName = "PinterestOAuth";

    private readonly SemaphoreSlim tokenLock = new(1, 1);

    private string? accessToken;
    private DateTimeOffset expiresAtUtc;

    public async Task<string> GetAccessTokenAsync(
        CancellationToken cancellationToken = default)
    {
        if (HasValidToken())
        {
            return accessToken!;
        }

        await tokenLock.WaitAsync(cancellationToken);

        try
        {
            if (HasValidToken())
            {
                return accessToken!;
            }

            var token = await RequestAccessTokenAsync(
                cancellationToken);

            accessToken = token.AccessToken;

            expiresAtUtc = timeProvider
                .GetUtcNow()
                .AddSeconds(token.ExpiresIn)
                .Subtract(TimeSpan.FromMinutes(5));

            return accessToken;
        }
        finally
        {
            tokenLock.Release();
        }
    }

    private bool HasValidToken()
    {
        return !string.IsNullOrWhiteSpace(accessToken) &&
               timeProvider.GetUtcNow() < expiresAtUtc;
    }

    private async Task<PinterestOAuthResponse> RequestAccessTokenAsync(
        CancellationToken cancellationToken)
    {
        var pinterestOptions = options.Value;

        var credentials = Convert.ToBase64String(
            Encoding.UTF8.GetBytes(
                $"{pinterestOptions.AppId}:" +
                $"{pinterestOptions.AppSecret}"));

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            pinterestOptions.OAuthUrl);

        request.Headers.Authorization =
            new AuthenticationHeaderValue(
                "Basic",
                credentials);

        request.Content = new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["scope"] = "boards:read,pins:read"
            });

        var client = httpClientFactory.CreateClient(
            HttpClientName);

        using var response = await client.SendAsync(
            request,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        var token =
            await response.Content
                .ReadFromJsonAsync<PinterestOAuthResponse>(
                    cancellationToken);

        if (token is null ||
            string.IsNullOrWhiteSpace(token.AccessToken) ||
            token.ExpiresIn <= 0)
        {
            throw new InvalidOperationException(
                "La réponse OAuth de Pinterest est invalide.");
        }

        return token;
    }
}