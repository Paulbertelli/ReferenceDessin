namespace ReferenceDessin.Application.Pinterest.GetPinterestReferenceImages;

public sealed record GetPinterestReferenceImagesQuery(
    string BoardId,
    string? SectionId,
    int? MaximumCount = null);