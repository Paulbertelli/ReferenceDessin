using System.Net.Http.Headers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using ReferenceDessin.Application.Photos;
using ReferenceDessin.Application.Pinterest;
using ReferenceDessin.Infrastructure.Identity;
using ReferenceDessin.Infrastructure.Persistence;
using ReferenceDessin.Infrastructure.Pexels;
using ReferenceDessin.Infrastructure.Pinterest;

namespace ReferenceDessin.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddPersistence(configuration);
        services.AddApplicationIdentity();
        services.AddPexels();
        services.AddPinterest();

        return services;
    }

    private static void AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("Database")
            ?? throw new InvalidOperationException(
                "La chaîne de connexion à la base de données est absente.");

        services.AddDbContext<ReferenceDessinDbContext>(options => options.UseNpgsql(connectionString));
    }

    private static void AddApplicationIdentity(this IServiceCollection services)
    {
        services
            .AddIdentityCore<ApplicationUser>(options => { options.User.RequireUniqueEmail = true; })
            .AddSignInManager()
            .AddEntityFrameworkStores<ReferenceDessinDbContext>();
    }

    private static void AddPexels(this IServiceCollection services)
    {
        services
            .AddOptions<PexelsOptions>()
            .BindConfiguration(PexelsOptions.SectionName)
            .Validate(
                options => Uri.TryCreate(
                    options.BaseUrl,
                    UriKind.Absolute,
                    out _),
                "L'URL de l'API Pexels est invalide.")
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.ApiKey),
                "La clé API Pexels est absente.")
            .ValidateOnStart();

        services.AddHttpClient<IPexelsPhotoProvider, PexelsClient>(
            (serviceProvider, client) =>
            {
                var options = serviceProvider
                    .GetRequiredService<IOptions<PexelsOptions>>()
                    .Value;

                client.BaseAddress = new Uri(options.BaseUrl);

                client.DefaultRequestHeaders.Add(
                    "Authorization",
                    options.ApiKey);

                client.Timeout = TimeSpan.FromSeconds(10);
            });
    }

    private static void AddPinterest(
        this IServiceCollection services)
    {
        services
            .AddOptions<PinterestOptions>()
            .BindConfiguration(PinterestOptions.SectionName)
            .Validate(
                options =>
                    Uri.TryCreate(
                        options.BaseUrl,
                        UriKind.Absolute,
                        out _),
                "L’URL de l’API Pinterest est invalide.")
            .Validate(
                options =>
                    Uri.TryCreate(
                        options.OAuthUrl,
                        UriKind.Absolute,
                        out _),
                "L’URL OAuth de Pinterest est invalide.")
            .Validate(
                options =>
                    !options.Enabled ||
                    !string.IsNullOrWhiteSpace(options.AppId),
                "L’identifiant de l’application Pinterest est absent.")
            .Validate(
                options =>
                    !options.Enabled ||
                    !string.IsNullOrWhiteSpace(options.AppSecret),
                "Le secret de l’application Pinterest est absent.")
            .ValidateOnStart();

        // Services utilisés pour obtenir et mettre en cache
        // le jeton OAuth Pinterest.
        services.AddSingleton(TimeProvider.System);

        services.AddHttpClient(
            PinterestAccessTokenProvider.HttpClientName,
            client => { client.Timeout = TimeSpan.FromSeconds(10); });

        services.AddSingleton<PinterestAccessTokenProvider>();
        services.AddTransient<PinterestAuthenticationHandler>();

        // Client utilisé pour appeler les tableaux,
        // sections et épingles.
        services
            .AddHttpClient<IPinterestCatalog, PinterestClient>(
                (serviceProvider, client) =>
                {
                    var options = serviceProvider
                        .GetRequiredService<
                            IOptions<PinterestOptions>>()
                        .Value;

                    client.BaseAddress =
                        new Uri(options.BaseUrl);

                    client.Timeout =
                        TimeSpan.FromSeconds(10);
                })
            .AddHttpMessageHandler<PinterestAuthenticationHandler>();
    }
}