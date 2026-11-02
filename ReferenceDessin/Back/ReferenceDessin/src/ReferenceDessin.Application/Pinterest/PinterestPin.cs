namespace ReferenceDessin.Application.Pinterest;

public sealed record PinterestPin(
    string Id,
    string? Title,
    string? Description,
    string OriginalUrl,
    string ImageUrl);