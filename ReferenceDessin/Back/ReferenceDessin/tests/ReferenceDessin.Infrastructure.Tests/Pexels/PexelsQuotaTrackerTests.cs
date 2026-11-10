using System.Net;
using System.Net.Http.Headers;
using System.Text;
using ReferenceDessin.Infrastructure.Pexels;

namespace ReferenceDessin.Infrastructure.Tests.Pexels;

public sealed class PexelsQuotaTrackerTests
{
    private static readonly DateTimeOffset Now = new(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Observe_StoresValidHeaders()
    {
        var time = new ManualTimeProvider(Now);
        var tracker = new PexelsQuotaTracker(time);
        tracker.Observe(Headers(20000, 17, Now.AddHours(2)));

        Assert.Equal(20000, tracker.Snapshot?.Limit);
        Assert.Equal(17, tracker.Snapshot?.Remaining);
        Assert.False(tracker.IsExhausted);
    }

    [Fact]
    public void Observe_ExhaustedQuota_BlocksUntilReset()
    {
        var time = new ManualTimeProvider(Now);
        var tracker = new PexelsQuotaTracker(time);
        tracker.Observe(Headers(20000, 0, Now.AddHours(2)));

        Assert.True(tracker.IsExhausted);
        time.UtcNow = Now.AddHours(2);
        Assert.False(tracker.IsExhausted);
    }

    [Fact]
    public void Observe_MissingOrInvalidHeaders_DoesNotInventQuota()
    {
        var tracker = new PexelsQuotaTracker(new ManualTimeProvider(Now));
        tracker.Observe(new HttpResponseMessage(HttpStatusCode.OK).Headers);
        Assert.Null(tracker.Snapshot);

        tracker.Observe(Headers(20000, 0, Now.AddHours(2)));
        var invalid = Headers(20000, 1, Now.AddHours(2));
        invalid.Remove("X-Ratelimit-Reset");
        tracker.Observe(invalid);
        Assert.True(tracker.IsExhausted);
    }

    [Fact]
    public void Observe_OutOfOrderResponses_CannotIncreaseRemainingInSamePeriod()
    {
        var tracker = new PexelsQuotaTracker(new ManualTimeProvider(Now));
        var reset = Now.AddHours(2);
        tracker.Observe(Headers(20000, 0, reset));
        tracker.Observe(Headers(20000, 5, reset));
        Assert.True(tracker.IsExhausted);
        Assert.Equal(0, tracker.Snapshot?.Remaining);
    }

    [Fact]
    public async Task Client_BlocksUpstreamCallWhenKnownExhausted_AndResumesAfterReset()
    {
        var time = new ManualTimeProvider(Now);
        var tracker = new PexelsQuotaTracker(time);
        tracker.Observe(Headers(20000, 0, Now.AddHours(2)));
        var calls = 0;
        using var httpClient = new HttpClient(new StubHandler(() =>
        {
            Interlocked.Increment(ref calls);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"photos\":[]}", Encoding.UTF8, "application/json")
            };
        })) { BaseAddress = new Uri("https://api.pexels.com/v1/") };
        var client = new PexelsClient(httpClient, tracker);

        var error = await Assert.ThrowsAsync<HttpRequestException>(
            () => client.SearchAsync("chat", 10));
        Assert.Equal(HttpStatusCode.TooManyRequests, error.StatusCode);
        Assert.Equal(0, calls);

        time.UtcNow = Now.AddHours(2);
        await client.SearchAsync("chat", 10);
        Assert.Equal(1, calls);
    }

    private static HttpResponseHeaders Headers(long limit, long remaining, DateTimeOffset reset)
    {
        var headers = new HttpResponseMessage(HttpStatusCode.OK).Headers;
        headers.TryAddWithoutValidation("X-Ratelimit-Limit", limit.ToString());
        headers.TryAddWithoutValidation("X-Ratelimit-Remaining", remaining.ToString());
        headers.TryAddWithoutValidation("X-Ratelimit-Reset", reset.ToUnixTimeSeconds().ToString());
        return headers;
    }

    private sealed class ManualTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public DateTimeOffset UtcNow { get; set; } = utcNow;
        public override DateTimeOffset GetUtcNow() => UtcNow;
    }

    private sealed class StubHandler(Func<HttpResponseMessage> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(respond());
    }
}