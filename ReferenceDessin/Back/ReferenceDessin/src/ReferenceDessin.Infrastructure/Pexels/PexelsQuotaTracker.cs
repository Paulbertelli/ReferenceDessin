using System.Globalization;
using System.Net.Http.Headers;

namespace ReferenceDessin.Infrastructure.Pexels;

/// <summary>
/// Conserve le dernier quota mensuel connu communiqué par Pexels.
/// Cet état est local au processus et n'est pas un compteur global distribué.
/// </summary>
public sealed class PexelsQuotaTracker(TimeProvider timeProvider)
{
    private readonly object _sync = new();
    private PexelsQuotaSnapshot? _snapshot;

    public PexelsQuotaSnapshot? Snapshot
    {
        get
        {
            lock (_sync)
            {
                return _snapshot;
            }
        }
    }

    public bool IsExhausted
    {
        get
        {
            lock (_sync)
            {
                return _snapshot is { Remaining: 0 } snapshot && snapshot.ResetsAt > timeProvider.GetUtcNow();
            }
        }
    }
    
    public void Observe(HttpResponseHeaders headers)
    {
        if (!TryReadNonNegativeLong(headers, "X-Ratelimit-Limit", out var limit) ||
            !TryReadNonNegativeLong(headers, "X-Ratelimit-Remaining", out var remaining) ||
            !TryReadNonNegativeLong(headers, "X-Ratelimit-Reset", out var resetSeconds) ||
            remaining > limit)
        {
            return;
        }

        DateTimeOffset resetsAt;
        
        try
        {
            resetsAt = DateTimeOffset.FromUnixTimeSeconds(resetSeconds);
        }
        catch (ArgumentOutOfRangeException)
        {
            return;
        }

        if (resetsAt <= timeProvider.GetUtcNow())
        {
            return;
        }

        lock (_sync)
        {
            // Des réponses HTTP peuvent arriver dans le désordre.
            // Pour une même période, ne jamais augmenter artificiellement le quota.
            if (_snapshot is { } current && current.ResetsAt == resetsAt)
            {
                remaining = Math.Min(current.Remaining, remaining);
            }
            else if (_snapshot is { } newer && newer.ResetsAt > resetsAt &&
                     newer.ResetsAt > timeProvider.GetUtcNow())
            {
                return;
            }

            _snapshot = new PexelsQuotaSnapshot(limit, remaining, resetsAt);
        }
    }

    private static bool TryReadNonNegativeLong(
        HttpResponseHeaders headers,
        string name,
        out long value)
    {
        value = 0;
        return headers.TryGetValues(name, out var values) && 
               long.TryParse(
                   values.SingleOrDefault(), 
                   NumberStyles.None, 
                   CultureInfo.InvariantCulture, 
                   out value) && 
               value >= 0;
    }
}

public sealed record PexelsQuotaSnapshot(long Limit, long Remaining, DateTimeOffset ResetsAt);