using System.Net;
using System.Text;
using Microsoft.Extensions.Options;
using ReferenceDessin.Infrastructure.Pinterest;

namespace ReferenceDessin.Infrastructure.Tests.Pinterest;

public sealed class PinterestAccessTokenProviderTests
{
    [Fact]
    public async Task GetAccessTokenAsync_WhenCalledTwice_RequestsTokenOnce()
    {
        // Arrange
        var requestCount = 0;
        string? authorizationScheme = null;
        string? authorizationValue = null;
        string? requestBody = null;

        using var httpClient = CreateHttpClient(
            async request =>
            {
                requestCount++;

                authorizationScheme =
                    request.Headers.Authorization?.Scheme;

                authorizationValue =
                    request.Headers.Authorization?.Parameter;

                requestBody = request.Content is null
                    ? null
                    : await request.Content.ReadAsStringAsync();

                return CreateJsonResponse(
                    """
                    {
                      "access_token": "pinc_test-token",
                      "expires_in": 2592000,
                      "token_type": "bearer"
                    }
                    """);
            });

        var provider = new PinterestAccessTokenProvider(
            new StubHttpClientFactory(httpClient),
            Options.Create(
                new PinterestOptions
                {
                    AppId = "app-id",
                    AppSecret = "app-secret",
                    OAuthUrl =
                        "https://api.pinterest.com/v5/oauth/token"
                }),
            TimeProvider.System);

        // Act
        var firstToken =
            await provider.GetAccessTokenAsync();

        var secondToken =
            await provider.GetAccessTokenAsync();

        // Assert
        Assert.Equal("pinc_test-token", firstToken);
        Assert.Equal(firstToken, secondToken);
        Assert.Equal(1, requestCount);

        Assert.Equal("Basic", authorizationScheme);

        var expectedCredentials =
            Convert.ToBase64String(
                Encoding.UTF8.GetBytes(
                    "app-id:app-secret"));

        Assert.Equal(
            expectedCredentials,
            authorizationValue);

        Assert.Contains(
            "grant_type=client_credentials",
            requestBody);

        Assert.Contains(
            "scope=boards%3Aread%2Cpins%3Aread",
            requestBody);
    }

    [Fact]
    public async Task GetAccessTokenAsync_WhenResponseIsInvalid_Throws()
    {
        // Arrange
        using var httpClient = CreateHttpClient(
            _ => Task.FromResult(
                CreateJsonResponse(
                    """
                    {
                      "access_token": "",
                      "expires_in": 0,
                      "token_type": "bearer"
                    }
                    """)));

        var provider = new PinterestAccessTokenProvider(
            new StubHttpClientFactory(httpClient),
            Options.Create(
                new PinterestOptions
                {
                    AppId = "app-id",
                    AppSecret = "app-secret",
                    OAuthUrl =
                        "https://api.pinterest.com/v5/oauth/token"
                }),
            TimeProvider.System);

        // Act
        var action = () =>
            provider.GetAccessTokenAsync();

        // Assert
        await Assert.ThrowsAsync<
            InvalidOperationException>(action);
    }

    private static HttpClient CreateHttpClient(
        Func<HttpRequestMessage, Task<HttpResponseMessage>>
            responseFactory)
    {
        return new HttpClient(
            new StubHttpMessageHandler(
                responseFactory));
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
            Assert.Equal(
                PinterestAccessTokenProvider.HttpClientName,
                name);

            return httpClient;
        }
    }

    private sealed class StubHttpMessageHandler(
        Func<HttpRequestMessage, Task<HttpResponseMessage>>
            responseFactory)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return responseFactory(request);
        }
    }
}