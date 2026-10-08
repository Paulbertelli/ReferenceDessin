namespace ReferenceDessin.Application.Photos.GetPhotos;

public sealed class GetPhotosHandler(
    IPhotoProvider photoProvider)
{
    public const int MinimumCount = 1;
    public const int MaximumCount = 80;

    public async Task<GetPhotosResult> HandleAsync(
        GetPhotosQuery query,
        CancellationToken cancellationToken = default)
    {
        if (query.Count is < MinimumCount or > MaximumCount)
        {
            return GetPhotosResult.Failure(
                GetPhotosError.InvalidCount);
        }

        var normalizedSearchTerm =
            string.IsNullOrWhiteSpace(query.SearchTerm)
                ? null
                : query.SearchTerm.Trim();

        var photos = await photoProvider.GetPhotosAsync(
            normalizedSearchTerm,
            query.Count,
            cancellationToken);

        return GetPhotosResult.Success(photos);
    }
}