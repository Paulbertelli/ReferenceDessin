using ReferenceDessin.Api;
using ReferenceDessin.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(
    builder.Configuration);

builder.Services.AddApiServices(
    builder.Configuration,
    builder.Environment);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/openapi/v1.json",
            "ReferenceDessin API v1");
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

await app.RunAsync();

namespace ReferenceDessin.Api
{
    public partial class Program;
}
