using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ReferenceDessin.Api.ErrorHandling;
using ReferenceDessin.Application.Photos;
using ReferenceDessin.Infrastructure.Identity;
using ReferenceDessin.Infrastructure.Persistence;
using ReferenceDessin.Infrastructure.Pexels;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";

    options.Cookie.Name =
        "ReferenceDessin.Antiforgery";

    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;

    options.Cookie.SecurePolicy =
        builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
});

builder.Services.AddHealthChecks();
builder.Services.AddExceptionHandler<ExternalApiExceptionHandler>();

builder.Services
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

builder.Services.AddHttpClient<IPhotoProvider, PexelsClient>(
    (services, client) =>
    {
        var options = services
            .GetRequiredService<IOptions<PexelsOptions>>()
            .Value;

        client.BaseAddress = new Uri(options.BaseUrl);
        client.DefaultRequestHeaders.Add(
            "Authorization",
            options.ApiKey);

        client.Timeout = TimeSpan.FromSeconds(10);
    });

builder.Services.AddControllersWithViews();

var chaineConnexion =
    builder.Configuration.GetConnectionString("BaseDeDonnees")
    ?? throw new InvalidOperationException(
        "La chaîne de connexion à la base de données est absente.");

builder.Services.AddDbContext<ReferenceDessinDbContext>(
    options =>
    {
        options.UseNpgsql(chaineConnexion);
    });

var identifiantClientGoogle =
    builder.Configuration[
        "Authentification:Google:IdentifiantClient"]
    ?? throw new InvalidOperationException(
        "L’identifiant client Google est absent.");

var secretClientGoogle =
    builder.Configuration[
        "Authentification:Google:SecretClient"]
    ?? throw new InvalidOperationException(
        "Le secret client Google est absent.");

var constructeurAuthentification =
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme =
            IdentityConstants.ApplicationScheme;

        options.DefaultSignInScheme =
            IdentityConstants.ExternalScheme;
    });

constructeurAuthentification.AddIdentityCookies();

constructeurAuthentification.AddGoogle(options =>
{
    options.ClientId = identifiantClientGoogle;
    options.ClientSecret = secretClientGoogle;
    options.SignInScheme =
        IdentityConstants.ExternalScheme;

    if (builder.Environment.IsDevelopment())
    {
        options.CorrelationCookie.SecurePolicy =
            CookieSecurePolicy.SameAsRequest;

        options.CorrelationCookie.SameSite =
            SameSiteMode.Lax;
    }
});

builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;
    })
    .AddSignInManager()
    .AddEntityFrameworkStores<ReferenceDessinDbContext>();

builder.Services.ConfigureExternalCookie(options =>
{
    options.Cookie.SecurePolicy =
        builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;

    options.Cookie.SameSite = SameSiteMode.Lax;
});

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name =
        "ReferenceDessin.Authentification";

    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;

    options.Cookie.SecurePolicy =
        builder.Environment.IsDevelopment()
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;

    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "ReferenceDessin API v1");
    });
}

app.UseExceptionHandler();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");
app.MapFallbackToFile("index.html");

app.Run();

namespace ReferenceDessin.Api
{
    public partial class Program;
}
