using System.Net;
using System.Text;
using Microsoft.Extensions.Options;
using ReferenceDessin.Infrastructure.Pinterest;

namespace ReferenceDessin.Infrastructure.Tests.Pinterest;

public sealed class PinterestAuthenticationHandlerTests
{
    [Fact]
    public async Task SendAsync_AddsPinterestBearerToken()
    {
        // Arrange
        using var oauthClient = new HttpClient(
            new StubHttpMessageHandler(_ =>
                CreateJsonResponse(
                    """
                    {
                      "access_token": "pinc_test-token",
                      "expires_in": 2592000,
                      "token_type": "bearer"
                    }
                    """)));

        var tokenProvider =
            new PinterestAccessTokenProvider(
                new StubHttpClientFactory(oauthClient),
                Options.Create(
                    new PinterestOptions
                    {
                        AppId = "app-id",
                        AppSecret = "app-secret",
                        OAuthUrl =
                            "https://api.pinterest.com/v5/oauth/token"
                    }),
                TimeProvider.System);

        string? receivedScheme = null;
        string? receivedToken = null;

        var apiHandler = new StubHttpMessageHandler(
            request =>
            {
                receivedScheme =
                    request.Headers.Authorization?.Scheme;

                receivedToken =
                    request.Headers.Authorization?.Parameter;

                return new HttpResponseMessage(
                    HttpStatusCode.OK);
            });

        var authenticationHandler =
            new PinterestAuthenticationHandler(
                tokenProvider)
            {
                InnerHandler = apiHandler
            };

        using var client =
            new HttpClient(authenticationHandler);

        // Act
        using var response = await client.GetAsync(
            "https://api.pinterest.com/v5/boards");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Bearer", receivedScheme);
        Assert.Equal("pinc_test-token", receivedToken);
    }

    private static HttpResponseMessage CreateJsonResponse(
        string json)
    {
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json")
        };
    }

    private sealed class StubHttpClientFactory(
        HttpClient httpClient)
        : IHttpClientFactory
    {
        public HttpClient CreateClient(string name)
        {
            return httpClient;
        }
    }

    private sealed class StubHttpMessageHandler(
        Func<HttpRequestMessage, HttpResponseMessage>
            responseFactory)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(
                responseFactory(request));
        }
    }
}