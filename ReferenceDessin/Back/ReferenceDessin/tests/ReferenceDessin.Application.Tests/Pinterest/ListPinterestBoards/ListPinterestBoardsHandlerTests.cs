using ReferenceDessin.Application.Pinterest;
using ReferenceDessin.Application.Pinterest.ListPinterestBoardSections;
using ReferenceDessin.Application.Pinterest.ListPinterestBoards;
using ReferenceDessin.Application.Tests.Stubs;

namespace ReferenceDessin.Application.Tests.Pinterest.ListPinterestBoards;

public sealed class ListPinterestBoardsHandlerTests
{
    [Fact]
    public async Task HandleAsync_ReturnsBoardsWithSectionCount()
    {
        // Arrange
        IReadOnlyCollection<PinterestBoard> boards =
        [
            new PinterestBoard(
                Id: "123",
                Name: "Portraits",
                Description:
                    "Références de portraits",
                ReferenceCount: 42)
        ];

        var catalog = new StubPinterestCatalog
        {
            BoardsToReturn = boards,

            SectionsToReturn =
            [
                new PinterestBoardSection(
                    Id: "section-1",
                    Name: "Visages"),
                new PinterestBoardSection(
                    Id: "section-2",
                    Name: "Poses")
            ]
        };

        var handler = new ListPinterestBoardsHandler(catalog);

        using var cancellationSource = new CancellationTokenSource();

        // Act
        var result = await handler.HandleAsync(cancellationSource.Token);

        // Assert
        var board = Assert.Single(result);

        Assert.Equal("123", board.Id);
        Assert.Equal("Portraits", board.Name);

        Assert.Equal("Références de portraits", board.Description);

        Assert.Equal(42, board.ReferenceCount);
        Assert.Equal(2, board.SectionCount);

        Assert.Equal(1, catalog.BoardCallCount);
        Assert.Equal(1, catalog.SectionCallCount);

        Assert.Equal("123", catalog.ReceivedSectionsBoardId);

        Assert.Equal(cancellationSource.Token, catalog.ReceivedBoardCancellationToken);

        Assert.Equal(cancellationSource.Token, catalog.ReceivedSectionCancellationToken);
    }
}