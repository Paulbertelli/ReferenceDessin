using ReferenceDessin.Application.Pinterest;
using ReferenceDessin.Application.Pinterest.ListPinterestBoardSections;

namespace ReferenceDessin.Application.Tests.Stubs;

public sealed class StubPinterestCatalog : IPinterestCatalog
{
    public IReadOnlyCollection<PinterestBoard> BoardsToReturn { get; set; } = [];

    public IReadOnlyCollection<PinterestBoardSection> SectionsToReturn { get; set; } = [];

    public IReadOnlyCollection<PinterestPin> PinsToReturn { get; set; } = [];

    public IReadOnlyDictionary<string, int> SectionPinCountsToReturn { get; set; } = 
        new Dictionary<string, int>();

    public int BoardCallCount { get; private set; }

    public int SectionCallCount { get; private set; }

    public int PinCallCount { get; private set; }

    public int SectionPinCountCallCount { get; private set; }

    public string? ReceivedSectionsBoardId { get; private set; }

    public string? ReceivedPinsBoardId { get; private set; }

    public string? ReceivedCountsBoardId { get; private set; }

    public string? ReceivedSectionId { get; private set; }

    public int? ReceivedMaximumCount { get; private set; }

    public CancellationToken ReceivedBoardCancellationToken { get; private set; }

    public CancellationToken ReceivedSectionCancellationToken { get; private set; }

    public CancellationToken ReceivedPinCancellationToken { get; private set; }

    public CancellationToken ReceivedCountCancellationToken { get; private set; }

    public Task<IReadOnlyCollection<PinterestBoard>> GetBoardsAsync(
        CancellationToken cancellationToken = default)
    {
        BoardCallCount++;

        ReceivedBoardCancellationToken = cancellationToken;

        return Task.FromResult(BoardsToReturn);
    }

    public Task<IReadOnlyCollection<PinterestBoardSection>> GetBoardSectionsAsync(
        string boardId,
        CancellationToken cancellationToken = default)
    {
        SectionCallCount++;

        ReceivedSectionsBoardId = boardId;

        ReceivedSectionCancellationToken = cancellationToken;

        return Task.FromResult(SectionsToReturn);
    }

    public Task<IReadOnlyDictionary<string, int>> GetBoardSectionPinCountsAsync(
        string boardId,
        CancellationToken cancellationToken = default)
    {
        SectionPinCountCallCount++;

        ReceivedCountsBoardId = boardId;

        ReceivedCountCancellationToken = cancellationToken;

        return Task.FromResult(SectionPinCountsToReturn);
    }

    public Task<IReadOnlyCollection<PinterestPin>> GetBoardPinsAsync(
        string boardId, 
        string? sectionId = null,
        int? maximumCount = null,
        CancellationToken cancellationToken = default)
    {
        PinCallCount++;

        ReceivedPinsBoardId = boardId;
        ReceivedSectionId = sectionId;
        ReceivedMaximumCount = maximumCount;

        ReceivedPinCancellationToken = cancellationToken;

        return Task.FromResult(PinsToReturn);
    }
}