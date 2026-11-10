using System.Net;
using Microsoft.AspNetCore.HttpOverrides;
using ReferenceDessin.Api;
using ReferenceDessin.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    var proxyAddress = builder.Configuration["ReverseProxy:KnownProxy"];

    options.ForwardedHeaders = ForwardedHeaders.None;

    if (IPAddress.TryParse(proxyAddress, out var trustedProxy))
    {
        options.KnownProxies.Clear();
        options.KnownIPNetworks.Clear();
        options.KnownProxies.Add(trustedProxy);

        options.ForwardedHeaders =
            ForwardedHeaders.XForwardedFor |
            ForwardedHeaders.XForwardedProto;

        options.ForwardLimit = 1;
    }
});

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddApiServices(builder.Configuration, builder.Environment);

var app = builder.Build();

app.UseForwardedHeaders();

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

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();
app.MapHealthChecks("/health");
app.MapFallbackToFile("index.html");

await app.RunAsync();

namespace ReferenceDessin.Api
{
    public partial class Program;
}
