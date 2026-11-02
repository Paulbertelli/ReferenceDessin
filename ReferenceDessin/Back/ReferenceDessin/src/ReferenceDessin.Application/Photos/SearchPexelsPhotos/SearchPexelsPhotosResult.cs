namespace ReferenceDessin.Application.Photos.SearchPexelsPhotos;

public enum SearchPexelsPhotosError
{
    None,
    InvalidCount
}

public sealed record SearchPexelsPhotosResult(
    IReadOnlyCollection<ReferenceImage> Images,
    SearchPexelsPhotosError Error)
{
    public bool IsSuccess => Error == SearchPexelsPhotosError.None;

    public static SearchPexelsPhotosResult Success(
        IReadOnlyCollection<ReferenceImage> images)
    {
        return new SearchPexelsPhotosResult(
            images,
            SearchPexelsPhotosError.None);
    }

    public static SearchPexelsPhotosResult Failure(
        SearchPexelsPhotosError error)
    {
        return new SearchPexelsPhotosResult(
            [],
            error);
    }
}