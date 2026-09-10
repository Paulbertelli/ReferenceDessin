using System.Net;
using System.Text;
using ReferenceDessin.Infrastructure.Pexels;

namespace ReferenceDessin.Infrastructure.Tests.Pexels;

public sealed class PexelsPhotoProviderTests
{
    [Fact]
    public async Task GetPhotosAsync_WhenQueryIsEmpty_CallsCuratedEndpoint()
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

        var provider = new PexelsPhotoProvider(httpClient);

        // Act
        var photos = await provider.GetPhotosAsync(
            query: null,
            count: 15);

        // Assert
        Assert.Empty(photos);

        Assert.Equal(
            "https://api.pexels.com/v1/curated?per_page=15",
            requestedUri?.AbsoluteUri);
    }

    [Fact]
    public async Task GetPhotosAsync_WhenQueryIsProvided_CallsSearchEndpoint()
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

        var provider = new PexelsPhotoProvider(httpClient);

        // Act
        await provider.GetPhotosAsync(
            query: "  chat noir  ",
            count: 12);

        // Assert
        Assert.Equal(
            "https://api.pexels.com/v1/search" +
            "?query=chat%20noir&locale=fr-FR&per_page=12",
            requestedUri?.AbsoluteUri);
    }

    [Fact]
    public async Task GetPhotosAsync_WhenResponseIsValid_MapsPhoto()
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

        var provider = new PexelsPhotoProvider(httpClient);

        // Act
        var photos = await provider.GetPhotosAsync(
            query: "chat",
            count: 1);

        // Assert
        var photo = Assert.Single(photos);

        Assert.Equal(123, photo.Id);
        Assert.Equal(
            "https://images.pexels.com/photo-123.jpeg",
            photo.ImageUrl);
        Assert.Equal(
            "https://www.pexels.com/photo/123",
            photo.PexelsUrl);
        Assert.Equal("Jane Doe", photo.Photographer);
        Assert.Equal(
            "https://www.pexels.com/@jane",
            photo.PhotographerUrl);
        Assert.Equal("Un chat noir", photo.Description);
        Assert.Equal("#AABBCC", photo.AverageColor);
    }

    [Fact]
    public async Task GetPhotosAsync_WhenPexelsReturnsError_ThrowsHttpRequestException()
    {
        // Arrange
        using var httpClient = CreateHttpClient(_ =>
            new HttpResponseMessage(HttpStatusCode.BadGateway));

        var provider = new PexelsPhotoProvider(httpClient);

        // Act
        var action = async () =>
            await provider.GetPhotosAsync(
                query: "portrait",
                count: 10);

        // Assert
        await Assert.ThrowsAsync<HttpRequestException>(action);
    }

    [Fact]
    public async Task GetPhotosAsync_WhenResponseIsNull_ReturnsEmptyCollection()
    {
        // Arrange
        using var httpClient = CreateHttpClient(_ =>
            CreateJsonResponse("null"));

        var provider = new PexelsPhotoProvider(httpClient);

        // Act
        var photos = await provider.GetPhotosAsync(
            query: null,
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