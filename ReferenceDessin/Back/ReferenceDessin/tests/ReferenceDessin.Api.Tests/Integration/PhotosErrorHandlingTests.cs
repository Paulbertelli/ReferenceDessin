using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ReferenceDessin.Application.Photos;

namespace ReferenceDessin.Api.Tests.Integration;

public sealed class PhotosErrorHandlingTests(
    PhotosApiFactory factory)
    : IClassFixture<PhotosApiFactory>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task GetPhotos_WhenPexelsFails_ReturnsProblemDetails()
    {
        // Act
        using var response = await client.GetAsync(
            "/api/photos?query=portrait&count=10");

        // Assert
        Assert.Equal(
            HttpStatusCode.BadGateway,
            response.StatusCode);

        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);

        var problem = await response.Content
            .ReadFromJsonAsync<ProblemDetails>();

        Assert.NotNull(problem);
        Assert.Equal(502, problem.Status);
        Assert.Equal(
            "Le service d’images est indisponible.",
            problem.Title);
        Assert.Equal(
            "Les images n’ont pas pu être récupérées auprès de Pexels.",
            problem.Detail);
        Assert.Equal("/api/photos", problem.Instance);
        Assert.True(problem.Extensions.ContainsKey("traceId"));
    }
}

public sealed class PhotosApiFactory
    : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(
        IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        
        builder.UseSetting(
            "ConnectionStrings:BaseDeDonnees",
            "Host=localhost;Port=5432;" +
            "Database=reference_dessin_tests;" +
            "Username=tests;Password=tests");

        builder.UseSetting(
            "Authentification:Google:IdentifiantClient",
            "client-google-tests");

        builder.UseSetting(
            "Authentification:Google:SecretClient",
            "secret-google-tests");

        builder.UseSetting(
            "Pexels:BaseUrl",
            "https://api.pexels.com/v1/");

        builder.UseSetting(
            "Pexels:ApiKey",
            "integration-test-key");

        builder.UseSetting(
            "ApplicationCliente:Url",
            "http://localhost");

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IPhotoProvider>();

            services.AddSingleton<
                IPhotoProvider,
                FailingPhotoProvider>();
        });
    }

    private sealed class FailingPhotoProvider
        : IPhotoProvider
    {
        public Task<IReadOnlyCollection<PhotoReference>>
            GetPhotosAsync(
                string? query,
                int count,
                CancellationToken cancellationToken = default)
        {
            throw new HttpRequestException(
                "Pexels est indisponible pendant le test.");
        }
    }
}