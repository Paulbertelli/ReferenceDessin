using System.Net;
using Microsoft.AspNetCore.Hosting;

namespace ReferenceDessin.Api.Tests.Integration;

public sealed class PhotosRateLimitingTests
{
    [Fact]
    public async Task Photos_AfterLimit_Returns429()
    {
        await using var factory = new RateLimitedPhotosApiFactory();
        using var client = factory.CreateClient();

        // The fake Pexels provider fails with 502. These requests must
        // reach the endpoint and consume the configured permits.
        for (var i = 0; i < 2; i++)
        {
            using var response = await client.GetAsync("/api/photos?query=test");
            Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        }

        using var blocked = await client.GetAsync("/api/photos?query=test");
        Assert.Equal(HttpStatusCode.TooManyRequests, blocked.StatusCode);
    }
}

public sealed class RateLimitedPhotosApiFactory : PhotosApiFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.UseSetting("RateLimiting:Photos:PermitLimit", "2");
        builder.UseSetting("RateLimiting:Photos:WindowSeconds", "3600");
    }
}