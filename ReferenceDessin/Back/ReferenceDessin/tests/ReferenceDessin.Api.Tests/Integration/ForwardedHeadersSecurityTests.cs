
using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ReferenceDessin.Api.Tests.Integration;

public sealed class ForwardedHeadersSecurityTests
{
    private const string TrustedProxy = "172.19.0.10";
    private const string UnknownProxy = "172.19.0.99";

    [Fact]
    public async Task TrustedProxy_AcceptsForwardedHttps()
    {
        using var factory = new ProxySecurityFactory(TrustedProxy);

        var context = await SendRequestAsync(factory, TrustedProxy);

        Assert.Equal("https", context.Request.Scheme);
        Assert.Equal(200, context.Response.StatusCode);
        Assert.True(context.Request.Headers.ContainsKey("X-Original-Proto"));
    }

    [Fact]
    public async Task UnknownProxy_IgnoresForwardedHttps()
    {
        using var factory = new ProxySecurityFactory(TrustedProxy);

        var context = await SendRequestAsync(factory, UnknownProxy);

        Assert.Equal("http", context.Request.Scheme);
        Assert.Equal("https", context.Request.Headers["X-Forwarded-Proto"].ToString());
        Assert.False(context.Request.Headers.ContainsKey("X-Original-Proto"));
    }

    [Fact]
    public async Task NoConfiguredProxy_IgnoresForwardedHttps()
    {
        using var factory = new ProxySecurityFactory(null);

        var context = await SendRequestAsync(factory, TrustedProxy);

        Assert.Equal("http", context.Request.Scheme);
        Assert.Equal("https", context.Request.Headers["X-Forwarded-Proto"].ToString());
        Assert.False(context.Request.Headers.ContainsKey("X-Original-Proto"));
    }

    private static async Task<Microsoft.AspNetCore.Http.HttpContext>
        SendRequestAsync(ProxySecurityFactory factory, string remoteIp)
    {
        return await factory.Server.SendAsync(context =>
        {
            context.Request.Method = "GET";
            context.Request.Path = "/health";
            context.Request.Scheme = "http";

            context.Connection.RemoteIpAddress = IPAddress.Parse(remoteIp);

            context.Request.Headers["X-Forwarded-Proto"] = "https";
            context.Request.Headers["X-Forwarded-For"] = "203.0.113.10";
        });
    }

    private sealed class ProxySecurityFactory(string? trustedProxy)
        : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.UseSetting(
                "ReverseProxy:KnownProxy",
                trustedProxy ?? "");

            builder.UseSetting(
                "ConnectionStrings:Database",
                "Host=localhost;Database=reference_dessin_tests;" +
                "Username=tests;Password=tests");

            builder.UseSetting(
                "Authentication:Google:ClientId",
                "client-google-tests");

            builder.UseSetting(
                "Authentication:Google:ClientSecret",
                "secret-google-tests");

            builder.UseSetting(
                "Pexels:ApiKey",
                "integration-test-key");

            builder.UseSetting(
                "ApplicationCliente:Url",
                "http://localhost");
        }
    }
}
