using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using ReferenceDessin.Application.Photos;
using ReferenceDessin.Infrastructure.Identity;
using ReferenceDessin.Infrastructure.Persistence;
using ReferenceDessin.Infrastructure.Pexels;

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

        return services;
    }
    
    private static void AddPersistence(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = 
            configuration.GetConnectionString("BaseDeDonnees")
            ?? throw new InvalidOperationException(
                "La chaîne de connexion à la base de données est absente.");

        services.AddDbContext<ReferenceDessinDbContext>(options => options.UseNpgsql(connectionString));
    }
    
    private static void AddApplicationIdentity(
        this IServiceCollection services)
    {
        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
            })
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

        services.AddHttpClient<IPhotoProvider, PexelsClient>(
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

}