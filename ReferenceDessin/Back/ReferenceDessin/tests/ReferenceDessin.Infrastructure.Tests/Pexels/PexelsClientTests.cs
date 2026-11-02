using System.Net;
using System.Text;
using ReferenceDessin.Infrastructure.Pexels;

namespace ReferenceDessin.Infrastructure.Tests.Pexels;

public sealed class PexelsClientTests
{
    [Fact]
    public async Task SearchAsync_WhenSearchTermIsEmpty_CallsCuratedEndpoint()
    {
        // Arrange
        Uri? requestedUri = null;

        using var httpClient = CreateHttpClient(request =>
        {
            requestedUri = request.RequestUri;

            return CreateJsonResponse(
                """
                {
                  "photos": []
                }
                """);
        });

        var client = new PexelsClient(httpClient);

        // Act
        var photos = await client.SearchAsync(
            searchTerm: null,
            count: 15);

        // Assert
        Assert.Empty(photos);

        Assert.Equal(
            "https://api.pexels.com/v1/curated?per_page=15",
            requestedUri?.AbsoluteUri);
    }

    [Fact]
    public async Task SearchAsync_WhenSearchTermIsProvided_CallsSearchEndpoint()
    {
        // Arrange
        Uri? requestedUri = null;

        using var httpClient = CreateHttpClient(request =>
        {
            requestedUri = request.RequestUri;

            return CreateJsonResponse(
                """
                {
                  "photos": []
                }
                """);
        });

        var client = new PexelsClient(httpClient);

        // Act
        await client.SearchAsync(
            searchTerm: "  chat noir  ",
            count: 12);

        // Assert
        Assert.Equal(
            "https://api.pexels.com/v1/search" +
            "?query=chat%20noir&locale=fr-FR&per_page=12",
            requestedUri?.AbsoluteUri);
    }

    [Fact]
    public async Task SearchAsync_WhenResponseIsValid_MapsReferenceImage()
    {
        // Arrange
        using var httpClient = CreateHttpClient(_ =>
            CreateJsonResponse(
                """
                {
                  "photos": [
                    {
                      "id": 123,
                      "url": "https://www.pexels.com/photo/123",
                      "photographer": "Jane Doe",
                      "photographer_url": "https://www.pexels.com/@jane",
                      "avg_color": "#AABBCC",
                      "alt": "Un chat noir",
                      "src": {
                        "large2x": "https://images.pexels.com/photo-123.jpeg"
                      }
                    }
                  ]
                }
                """));

        var client = new PexelsClient(httpClient);

        // Act
        var photos = await client.SearchAsync(
            searchTerm: "chat",
            count: 1);

        // Assert
        var photo = Assert.Single(photos);

        Assert.Equal("123", photo.ExternalId);
        Assert.Equal(
            "https://images.pexels.com/photo-123.jpeg",
            photo.ImageUrl);
        Assert.Equal("Pexels", photo.SourceName);
        Assert.Equal(
            "https://www.pexels.com/photo/123",
            photo.OriginalUrl);
        Assert.Equal("Jane Doe", photo.AuthorName);
        Assert.Equal(
            "https://www.pexels.com/@jane",
            photo.AuthorUrl);
        Assert.Equal("Un chat noir", photo.Description);
        Assert.Equal("#AABBCC", photo.AverageColor);
    }

    [Fact]
    public async Task SearchAsync_WhenPexelsReturnsError_ThrowsHttpRequestException()
    {
        // Arrange
        using var httpClient = CreateHttpClient(_ =>
            new HttpResponseMessage(HttpStatusCode.BadGateway));

        var client = new PexelsClient(httpClient);

        // Act
        var action = async () =>
            await client.SearchAsync(
                searchTerm: "portrait",
                count: 10);

        // Assert
        await Assert.ThrowsAsync<HttpRequestException>(action);
    }

    [Fact]
    public async Task SearchAsync_WhenResponseIsNull_ReturnsEmptyCollection()
    {
        // Arrange
        using var httpClient = CreateHttpClient(_ =>
            CreateJsonResponse("null"));

        var client = new PexelsClient(httpClient);

        // Act
        var photos = await client.SearchAsync(
            searchTerm: null,
            count: 10);

        // Assert
        Assert.Empty(photos);
    }

    private static HttpClient CreateHttpClient(
        Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
    {
        var handler = new StubHttpMessageHandler(responseFactory);

        return new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.pexels.com/v1/")
        };
    }

    private static HttpResponseMessage CreateJsonResponse(string json)
    {
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json")
        };
    }

    private sealed class StubHttpMessageHandler(
        Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(responseFactory(request));
        }
    }
}