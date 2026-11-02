namespace ReferenceDessin.Application.Photos;

public interface IPexelsPhotoProvider
{
    Task<IReadOnlyCollection<ReferenceImage>> SearchAsync(
        string? searchTerm,
        int count,
        CancellationToken cancellationToken = default);
}