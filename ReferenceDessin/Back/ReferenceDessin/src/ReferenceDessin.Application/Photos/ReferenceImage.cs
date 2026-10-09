namespace ReferenceDessin.Application.Photos;

public sealed record ReferenceImage(
    string ExternalId,
    string ImageUrl,
    string SourceName,
    string OriginalUrl,
    string? AuthorName,
    string? AuthorUrl,
    string Description,
    string? AverageColor);