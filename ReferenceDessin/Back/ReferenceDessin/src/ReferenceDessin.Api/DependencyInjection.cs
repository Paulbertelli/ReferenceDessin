using Microsoft.AspNetCore.Identity;
using ReferenceDessin.Api.ErrorHandling;

namespace ReferenceDessin.Api;

public static class DependencyInjection
{
    public static IServiceCollection AddApiServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddOpenApi();
        services.AddProblemDetails();
        services.AddHealthChecks();
        services.AddExceptionHandler<ExternalApiExceptionHandler>();
        services.AddControllersWithViews();
        
        services.AddApplicationAntiforgery(environment);
        services.AddApplicationAuthentication(
            configuration,
            environment);

        services.AddAuthorization();

        return services;
    }
    
    private static IServiceCollection AddApplicationAntiforgery(
        this IServiceCollection services,
        IWebHostEnvironment environment)
    {
        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-XSRF-TOKEN";

            options.Cookie.Name =
                "ReferenceDessin.Antiforgery";

            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Strict;

            options.Cookie.SecurePolicy =
                environment.IsDevelopment()
                    ? CookieSecurePolicy.SameAsRequest
                    : CookieSecurePolicy.Always;
        });

        return services;
    }
    
    private static IServiceCollection AddApplicationAuthentication(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        var googleClientId =
            configuration[
                "Authentication:Google:ClientId"]
            ?? throw new InvalidOperationException(
                "L’identifiant client Google est absent.");

        var googleClientSecret =
            configuration[
                "Authentication:Google:ClientSecret"]
            ?? throw new InvalidOperationException(
                "Le secret client Google est absent.");

        var authenticationBuilder =
            services.AddAuthentication(options =>
            {
                options.DefaultScheme =
                    IdentityConstants.ApplicationScheme;

                options.DefaultSignInScheme =
                    IdentityConstants.ExternalScheme;
            });

        authenticationBuilder.AddIdentityCookies();

        authenticationBuilder.AddGoogle(options =>
        {
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;

            options.SignInScheme =
                IdentityConstants.ExternalScheme;

            if (environment.IsDevelopment())
            {
                options.CorrelationCookie.SecurePolicy =
                    CookieSecurePolicy.SameAsRequest;

                options.CorrelationCookie.SameSite =
                    SameSiteMode.Lax;
            }
        });

        services.ConfigureExternalCookie(options =>
        {
            options.Cookie.SecurePolicy =
                environment.IsDevelopment()
                    ? CookieSecurePolicy.SameAsRequest
                    : CookieSecurePolicy.Always;

            options.Cookie.SameSite = SameSiteMode.Lax;
        });

        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name =
                "ReferenceDessin.Authentification";

            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;

            options.Cookie.SecurePolicy =
                environment.IsDevelopment()
                    ? CookieSecurePolicy.SameAsRequest
                    : CookieSecurePolicy.Always;

            options.ExpireTimeSpan = TimeSpan.FromDays(7);
            options.SlidingExpiration = true;
        });

        return services;
    }
}