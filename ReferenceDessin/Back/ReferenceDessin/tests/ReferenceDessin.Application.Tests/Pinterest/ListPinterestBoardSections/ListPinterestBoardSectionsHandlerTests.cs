using ReferenceDessin.Application.Pinterest.ListPinterestBoardSections;
using ReferenceDessin.Application.Tests.Stubs;

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

        var handler = new ListPinterestBoardSectionsHandler(catalog);

        var query = new ListPinterestBoardSectionsQuery(boardId);

        // Act
        var result = await handler.HandleAsync(query);

        // Assert
        Assert.False(result.IsSuccess);

        Assert.Equal(ListPinterestBoardSectionsError.InvalidBoardId, result.Error);

        Assert.Empty(result.Sections);
        Assert.Equal(0, catalog.SectionCallCount);
        Assert.Equal(0, catalog.SectionPinCountCallCount);
    }

    [Fact]
    public async Task HandleAsync_NormalizesBoardIdAndReturnsEnrichedSections()
    {
        // Arrange
        IReadOnlyCollection<PinterestBoardSection> sections =
            [
                new(
                    "section-1",
                    "Visages"),
                new(
                    "section-2",
                    "Poses")
            ];

        var catalog = new StubPinterestCatalog
        {
            SectionsToReturn = sections,

            SectionPinCountsToReturn = new Dictionary<string, int> 
            { 
                ["section-1"] = 12,
                ["section-2"] = 4
            }
        };

        var handler = new ListPinterestBoardSectionsHandler(catalog);

        var query = new ListPinterestBoardSectionsQuery("  board-123  ");

        using var cancellationSource = new CancellationTokenSource();

        // Act
        var result = await handler.HandleAsync(query, cancellationSource.Token);

        // Assert
        Assert.True(result.IsSuccess);

        Assert.Equal(ListPinterestBoardSectionsError.None, result.Error);

        Assert.Equal(
            [
                new PinterestBoardSection(
                    "section-1",
                    "Visages",
                    12),
                new PinterestBoardSection(
                    "section-2",
                    "Poses",
                    4)
            ],
            result.Sections);

        Assert.Equal("board-123", catalog.ReceivedSectionsBoardId);

        Assert.Equal("board-123", catalog.ReceivedCountsBoardId);

        Assert.Equal(cancellationSource.Token, catalog.ReceivedSectionCancellationToken);

        Assert.Equal(cancellationSource.Token, catalog.ReceivedCountCancellationToken);

        Assert.Equal(1, catalog.SectionCallCount);

        Assert.Equal(1, catalog.SectionPinCountCallCount);
    }
}