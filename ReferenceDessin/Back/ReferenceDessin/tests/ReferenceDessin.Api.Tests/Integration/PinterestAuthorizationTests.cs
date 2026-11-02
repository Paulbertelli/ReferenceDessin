using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ReferenceDessin.Api.Tests.Integration;

public sealed class PinterestAuthorizationTests(
    PhotosApiFactory factory)
    : IClassFixture<PhotosApiFactory>
{
    private readonly HttpClient _client =
        factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });

    [Fact]
    public async Task GetBoards_WhenUserIsNotAuthenticated_ReturnsUnauthorized()
    {
        // Act
        using var response = await _client.GetAsync(
            "/api/pinterest/boards");

        // Assert
        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);
    }
}