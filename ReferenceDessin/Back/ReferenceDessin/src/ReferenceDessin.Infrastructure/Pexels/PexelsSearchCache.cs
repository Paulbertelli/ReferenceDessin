using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;
using ReferenceDessin.Application.Photos;

namespace ReferenceDessin.Infrastructure.Pexels;

/// <summary>
///Stocker les résultats et coordonner les recherches simultanées.
/// </summary>
public sealed class PexelsSearchCache : IDisposable
{
    private readonly static TimeSpan CacheDuration = TimeSpan.FromHours(24);

    private readonly MemoryCache _cache = new(new MemoryCacheOptions
    {
        SizeLimit = 500
    });

    private readonly ConcurrentDictionary<string, Lazy<Task<IReadOnlyCollection<ReferenceImage>>>>
        _inFlight = new(StringComparer.Ordinal);

    public async Task<IReadOnlyCollection<ReferenceImage>> GetOrCreateAsync(
        string? searchTerm,
        int count,
        Func<Task<IReadOnlyCollection<ReferenceImage>>> fetch,
        CancellationToken cancellationToken = default)
    {
        var normalizedTerm = string.IsNullOrWhiteSpace(searchTerm)
            ? string.Empty
            : searchTerm.Trim();

        // Prefix lengths to avoid collisions and keep count in the cache identity.
        var key = $"pexels:{normalizedTerm.Length}:{normalizedTerm}:{count}";

        if (_cache.TryGetValue(key, out IReadOnlyCollection<ReferenceImage>? cached))
            return cached!;

        var pending = _inFlight.GetOrAdd(key, _ =>
            new Lazy<Task<IReadOnlyCollection<ReferenceImage>>>(
                () => FetchAndCacheAsync(key, fetch),
                LazyThreadSafetyMode.ExecutionAndPublication));

        // Cancelling an HTTP request stops waiting but does not cancel the shared
        // upstream call that other callers may still need.
        return await pending.Value.WaitAsync(cancellationToken);
    }

    private async Task<IReadOnlyCollection<ReferenceImage>> FetchAndCacheAsync(
        string key,
        Func<Task<IReadOnlyCollection<ReferenceImage>>> fetch)
    {
        try
        {
            // A second lookup avoids a redundant fetch when another request
            // completes between the initial lookup and joining in-flight work.
            if (_cache.TryGetValue(key, out IReadOnlyCollection<ReferenceImage>? existing))
                return existing!;

            var result = (await fetch()).ToArray();
            _cache.Set(key, (IReadOnlyCollection<ReferenceImage>)result,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = CacheDuration,
                    Size = 1
                });
            return result;
        }
        finally
        {
            _inFlight.TryRemove(key, out _);
        }
    }

    public void Dispose()
    {
        _cache.Dispose();
    }
}