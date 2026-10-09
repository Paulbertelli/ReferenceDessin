namespace ReferenceDessin.Application.Photos.SearchPexelsPhotos;

public sealed class SearchPexelsPhotosHandler(
    IPexelsPhotoProvider pexelsPhotoProvider)
{
    public const int MinimumCount = 1;
    public const int MaximumCount = 80;

    public async Task<SearchPexelsPhotosResult> HandleAsync(
        SearchPexelsPhotosQuery query,
        CancellationToken cancellationToken = default)
    {
        if (query.Count is < MinimumCount or > MaximumCount)
        {
            return SearchPexelsPhotosResult.Failure(
                SearchPexelsPhotosError.InvalidCount);
        }

        var normalizedSearchTerm =
            string.IsNullOrWhiteSpace(query.SearchTerm)
                ? null
                : query.SearchTerm.Trim();

        var images = await pexelsPhotoProvider.SearchAsync(
            normalizedSearchTerm,
            query.Count,
            cancellationToken);

        return SearchPexelsPhotosResult.Success(images);
    }
}