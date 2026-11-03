using ReferenceDessin.Application.Photos;

namespace ReferenceDessin.Infrastructure.Pexels;

/// <summary>
/// Décider d'utiliser le cache ou d'appeler PexelsClient.
/// </summary>
public sealed class CachedPexelsPhotoProvider(
    PexelsClient client,
    PexelsSearchCache cache) : IPexelsPhotoProvider
{
    public Task<IReadOnlyCollection<ReferenceImage>> SearchAsync(
        string? searchTerm,
        int count,
        CancellationToken cancellationToken = default)
    {
        var normalized = string.IsNullOrWhiteSpace(searchTerm)
            ? null
            : searchTerm.Trim();

        return cache.GetOrCreateAsync(
            normalized,
            count,
            () => client.SearchAsync(normalized, count, CancellationToken.None),
            cancellationToken);
    }
}