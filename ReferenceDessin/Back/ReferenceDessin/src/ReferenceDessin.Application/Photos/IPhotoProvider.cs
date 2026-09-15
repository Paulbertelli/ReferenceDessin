namespace ReferenceDessin.Application.Photos;

public interface IPhotoProvider
{
    Task<IReadOnlyCollection<PhotoReference>> GetPhotosAsync(
        string? query,
        int count,
        CancellationToken cancellationToken = default);
}