using System.Net;
using System.Text;
using ReferenceDessin.Infrastructure.Pexels;

namespace ReferenceDessin.Infrastructure.Tests.Pexels;

public sealed class CachedPexelsPhotoProviderTests
{
    [Fact]
    public async Task IdenticalSearches_OnlyCallPexelsOnce()
    {
        var calls = 0;
        using var cache = new PexelsSearchCache();
        using var http = CreateClient((_, _) =>
        {
            Interlocked.Increment(ref calls);
            return Task.FromResult(Success());
        });
        var provider = new CachedPexelsPhotoProvider(new PexelsClient(http), cache);

        await provider.SearchAsync("  chat  ", 10);
        await provider.SearchAsync("chat", 10);

        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task DifferentParameters_UseDifferentCacheEntries()
    {
        var calls = 0;
        using var cache = new PexelsSearchCache();
        using var http = CreateClient((_, _) =>
        {
            Interlocked.Increment(ref calls);
            return Task.FromResult(Success());
        });
        var provider = new CachedPexelsPhotoProvider(new PexelsClient(http), cache);

        await provider.SearchAsync("chat", 10);
        await provider.SearchAsync("chien", 10);
        await provider.SearchAsync("chat", 20);

        Assert.Equal(3, calls);
    }

    [Fact]
    public async Task FailedSearch_IsNotCached()
    {
        var calls = 0;
        using var cache = new PexelsSearchCache();
        using var http = CreateClient((_, _) =>
            Task.FromResult(Interlocked.Increment(ref calls) == 1
                ? new HttpResponseMessage(HttpStatusCode.BadGateway)
                : Success()));
        var provider = new CachedPexelsPhotoProvider(new PexelsClient(http), cache);

        await Assert.ThrowsAsync<HttpRequestException>(
            () => provider.SearchAsync("chat", 10));
        await provider.SearchAsync("chat", 10);

        Assert.Equal(2, calls);
    }

    [Fact]
    public async Task ConcurrentIdenticalSearches_ShareTheSameUpstreamRequest()
    {
        var calls = 0;
        var release = new TaskCompletionSource<HttpResponseMessage>(
            TaskCreationOptions.RunContinuationsAsynchronously);
        using var cache = new PexelsSearchCache();
        using var http = CreateClient((_, _) =>
        {
            Interlocked.Increment(ref calls);
            return release.Task;
        });
        var provider = new CachedPexelsPhotoProvider(new PexelsClient(http), cache);

        var first = provider.SearchAsync("chat", 10);
        var second = provider.SearchAsync("chat", 10);
        Assert.Equal(1, calls);

        release.SetResult(Success());
        await Task.WhenAll(first, second);
        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task CancellingOneWaiter_DoesNotCancelTheSharedRequest()
    {
        var calls = 0;
        var release = new TaskCompletionSource<HttpResponseMessage>(
            TaskCreationOptions.RunContinuationsAsynchronously);
        using var cache = new PexelsSearchCache();
        using var http = CreateClient((_, _) =>
        {
            Interlocked.Increment(ref calls);
            return release.Task;
        });
        var provider = new CachedPexelsPhotoProvider(new PexelsClient(http), cache);
        using var cancellation = new CancellationTokenSource();
        var cancelled = provider.SearchAsync("chat", 10, cancellation.Token);
        var other = provider.SearchAsync("chat", 10);

        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => cancelled);
        release.SetResult(Success());
        await other;
        await provider.SearchAsync("chat", 10);
        Assert.Equal(1, calls);
    }

    private static HttpClient CreateClient(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> send)
    {
        return new HttpClient(new Handler(send))
        {
            BaseAddress = new Uri("https://api.pexels.com/v1/")
        };
    }

    private static HttpResponseMessage Success()
    {
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("""{"photos":[]}""", Encoding.UTF8, "application/json")
        };
    }

    private sealed class Handler(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> send)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return send(request, cancellationToken);
        }
    }
}