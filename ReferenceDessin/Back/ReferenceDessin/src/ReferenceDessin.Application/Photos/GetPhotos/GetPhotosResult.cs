namespace ReferenceDessin.Application.Photos.GetPhotos;

public enum GetPhotosError
{
    None,
    InvalidCount
}

public sealed record GetPhotosResult(
    IReadOnlyCollection<PhotoReference> Photos,
    GetPhotosError Error)
{
    public bool IsSuccess => Error == GetPhotosError.None;

    public static GetPhotosResult Success(
        IReadOnlyCollection<PhotoReference> photos)
    {
        return new GetPhotosResult(
            photos,
            GetPhotosError.None);
    }

    public static GetPhotosResult Failure(
        GetPhotosError error)
    {
        return new GetPhotosResult(
            [],
            error);
    }
}