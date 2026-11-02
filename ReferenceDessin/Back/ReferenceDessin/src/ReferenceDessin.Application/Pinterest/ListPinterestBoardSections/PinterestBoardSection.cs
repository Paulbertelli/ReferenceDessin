namespace ReferenceDessin.Application.Pinterest.ListPinterestBoardSections;

public sealed record PinterestBoardSection(
    string Id,
    string Name,
    int ReferenceCount = 0);