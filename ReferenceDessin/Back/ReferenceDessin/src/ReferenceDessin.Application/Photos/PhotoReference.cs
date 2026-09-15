namespace ReferenceDessin.Application.Photos;

public sealed record PhotoReference(
    long Id,
    string ImageUrl,
    string PexelsUrl,
    string Photographer,
    string PhotographerUrl,
    string Description,
    string AverageColor);