using ReferenceDessin.Application.Pinterest;
using ReferenceDessin.Application.Pinterest.ListPinterestBoards;

namespace ReferenceDessin.Application.Tests.Pinterest.ListPinterestBoards;

public sealed class ListPinterestBoardsHandlerTests
{
    [Fact]
    public async Task HandleAsync_ReturnsBoardsFromCatalog()
    {
        // Arrange
        IReadOnlyCollection<PinterestBoard> expectedBoards =
        [
            new PinterestBoard(
                Id: "123",
                Name: "Portraits",
                Description: "Références de portraits"),
            new PinterestBoard(
                Id: "456",
                Name: "Anatomie",
                Description: null)
        ];

        var catalog = new StubPinterestCatalog
        {
            BoardsToReturn = expectedBoards
        };

        var handler = new ListPinterestBoardsHandler(
            catalog);

        using var cancellationSource =
            new CancellationTokenSource();

        // Act
        var boards = await handler.HandleAsync(
            cancellationSource.Token);

        // Assert
        Assert.Same(expectedBoards, boards);
        Assert.Equal(
            cancellationSource.Token,
            catalog.ReceivedCancellationToken);
        Assert.Equal(1, catalog.CallCount);
    }

    private sealed class StubPinterestCatalog
        : IPinterestCatalog
    {
        public IReadOnlyCollection<PinterestBoard>
            BoardsToReturn { get; init; } = [];

        public int CallCount { get; private set; }

        public CancellationToken ReceivedCancellationToken
        {
            get;
            private set;
        }

        public Task<IReadOnlyCollection<PinterestBoard>>
            GetBoardsAsync(
                CancellationToken cancellationToken = default)
        {
            CallCount++;
            ReceivedCancellationToken = cancellationToken;

            return Task.FromResult(BoardsToReturn);
        }
    }
}