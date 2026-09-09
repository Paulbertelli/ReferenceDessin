using Microsoft.Extensions.Options;
using ReferenceDessin.Application.Photos;
using ReferenceDessin.Infrastructure.Pexels;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

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

builder.Services.AddHttpClient<IPhotoProvider, PexelsPhotoProvider>(
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

builder.Services.AddControllers();

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

app.UseHttpsRedirection();

app.MapControllers();

app.Run();
