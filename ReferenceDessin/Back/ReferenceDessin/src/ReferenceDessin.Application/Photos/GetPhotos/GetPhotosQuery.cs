namespace ReferenceDessin.Application.Photos.GetPhotos;

public sealed record GetPhotosQuery(string? SearchTerm, int Count);