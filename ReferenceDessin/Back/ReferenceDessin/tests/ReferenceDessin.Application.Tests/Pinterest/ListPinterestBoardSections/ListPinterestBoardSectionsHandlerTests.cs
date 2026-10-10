using ReferenceDessin.Application.Pinterest;
using ReferenceDessin.Application.Pinterest.ListPinterestBoardSections;

namespace ReferenceDessin.Application.Tests.Pinterest.ListPinterestBoardSections;

public sealed class ListPinterestBoardSectionsHandlerTests
{
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task HandleAsync_WhenBoardIdIsInvalid_ReturnsFailure(
        string boardId)
    {
        // Arrange
        var catalog = new StubPinterestCatalog();

        var handler =
            new ListPinterestBoardSectionsHandler(catalog);

        var query =
            new ListPinterestBoardSectionsQuery(boardId);

        // Act
        var result = await handler.HandleAsync(query);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(
            ListPinterestBoardSectionsError.InvalidBoardId,
            result.Error);
        Assert.Empty(result.Sections);
        Assert.Equal(0, catalog.SectionCallCount);
    }

    [Fact]
    public async Task HandleAsync_NormalizesBoardIdAndReturnsSections()
    {
        // Arrange
        IReadOnlyCollection<PinterestBoardSection>
            expectedSections =
        [
            new PinterestBoardSection(
                Id: "section-1",
                Name: "Visages"),
            new PinterestBoardSection(
                Id: "section-2",
                Name: "Poses")
        ];

        var catalog = new StubPinterestCatalog
        {
            SectionsToReturn = expectedSections
        };

        var handler =
            new ListPinterestBoardSectionsHandler(catalog);

        var query =
            new ListPinterestBoardSectionsQuery(
                BoardId: "  board-123  ");

        using var cancellationSource =
            new CancellationTokenSource();

        // Act
        var result = await handler.HandleAsync(
            query,
            cancellationSource.Token);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(
            ListPinterestBoardSectionsError.None,
            result.Error);
        Assert.Same(expectedSections, result.Sections);
        Assert.Equal("board-123", catalog.ReceivedBoardId);
        Assert.Equal(
            cancellationSource.Token,
            catalog.ReceivedCancellationToken);
        Assert.Equal(1, catalog.SectionCallCount);
    }

    private sealed class StubPinterestCatalog
        : IPinterestCatalog
    {
        public IReadOnlyCollection<PinterestBoardSection>
            SectionsToReturn { get; init; } = [];

        public int SectionCallCount { get; private set; }

        public string? ReceivedBoardId { get; private set; }

        public CancellationToken ReceivedCancellationToken
        {
            get;
            private set;
        }

        public Task<IReadOnlyCollection<PinterestBoard>>
            GetBoardsAsync(
                CancellationToken cancellationToken = default)
        {
            return Task.FromResult<
                IReadOnlyCollection<PinterestBoard>>([]);
        }

        public Task<
            IReadOnlyCollection<PinterestBoardSection>>
            GetBoardSectionsAsync(
                string boardId,
                CancellationToken cancellationToken = default)
        {
            SectionCallCount++;
            ReceivedBoardId = boardId;
            ReceivedCancellationToken = cancellationToken;

            return Task.FromResult(SectionsToReturn);
        }
    }
}