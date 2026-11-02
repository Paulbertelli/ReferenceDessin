namespace ReferenceDessin.Application.Pinterest;

public sealed record PinterestBoard(
    string Id,
    string Name,
    string? Description,
    int ReferenceCount = 0,
    int SectionCount = 0);