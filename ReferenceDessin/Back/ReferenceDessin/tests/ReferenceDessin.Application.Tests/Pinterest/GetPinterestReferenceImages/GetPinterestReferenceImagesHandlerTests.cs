using ReferenceDessin.Application.Pinterest;
using ReferenceDessin.Application.Pinterest.GetPinterestReferenceImages;
using ReferenceDessin.Application.Pinterest.ListPinterestBoardSections;

namespace ReferenceDessin.Application.Tests.Pinterest.GetPinterestReferenceImages;

public sealed class GetPinterestReferenceImagesHandlerTests
{
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task HandleAsync_WhenBoardIdIsInvalid_ReturnsFailure(
        string boardId)
    {
        var catalog = new StubPinterestCatalog();
        var handler = new GetPinterestReferenceImagesHandler(catalog);

        var query = new GetPinterestReferenceImagesQuery(
            BoardId: boardId,
            SectionId: null);

        var result = await handler.HandleAsync(query);

        Assert.False(result.IsSuccess);
        Assert.Equal(
            GetPinterestReferenceImagesError.InvalidBoardId,
            result.Error);
        Assert.Empty(result.Images);
        Assert.Equal(0, catalog.PinCallCount);
    }

    [Fact]
    public async Task HandleAsync_WhenIdentifiersHaveSpaces_NormalizesThem()
    {
        var catalog = new StubPinterestCatalog();
        var handler = new GetPinterestReferenceImagesHandler(catalog);

        using var cancellationSource =
            new CancellationTokenSource();

        var query = new GetPinterestReferenceImagesQuery(
            BoardId: "  board-123  ",
            SectionId: "  section-456  ");

        await handler.HandleAsync(
            query,
            cancellationSource.Token);

        Assert.Equal("board-123", catalog.ReceivedBoardId);
        Assert.Equal("section-456", catalog.ReceivedSectionId);
        Assert.Equal(
            cancellationSource.Token,
            catalog.ReceivedCancellationToken);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task HandleAsync_WhenSectionIdIsEmpty_PassesNull(
        string? sectionId)
    {
        var catalog = new StubPinterestCatalog();
        var handler = new GetPinterestReferenceImagesHandler(catalog);

        var query = new GetPinterestReferenceImagesQuery(
            BoardId: "board-123",
            SectionId: sectionId);

        await handler.HandleAsync(query);

        Assert.Null(catalog.ReceivedSectionId);
    }

    [Fact]
    public async Task HandleAsync_WhenPinsExist_MapsReferenceImages()
    {
        IReadOnlyCollection<PinterestPin> pins =
        [
            new PinterestPin(
                Id: "pin-123",
                Title: "Portrait",
                Description: "Portrait au crayon",
                OriginalUrl:
                    "https://www.pinterest.com/pin/pin-123/",
                ImageUrl:
                    "https://images.example/portrait.jpg")
        ];

        var catalog = new StubPinterestCatalog
        {
            PinsToReturn = pins
        };

        var handler = new GetPinterestReferenceImagesHandler(catalog);

        var result = await handler.HandleAsync(
            new GetPinterestReferenceImagesQuery(
                BoardId: "board-123",
                SectionId: null));

        Assert.True(result.IsSuccess);
        Assert.Equal(
            GetPinterestReferenceImagesError.None,
            result.Error);

        var image = Assert.Single(result.Images);

        Assert.Equal("pin-123", image.ExternalId);
        Assert.Equal(
            "https://images.example/portrait.jpg",
            image.ImageUrl);
        Assert.Equal("Pinterest", image.SourceName);
        Assert.Equal(
            "https://www.pinterest.com/pin/pin-123/",
            image.OriginalUrl);
        Assert.Null(image.AuthorName);
        Assert.Null(image.AuthorUrl);
        Assert.Equal(
            "Portrait au crayon",
            image.Description);
        Assert.Null(image.AverageColor);
    }

    [Fact]
    public async Task HandleAsync_WhenDescriptionIsNull_UsesTitle()
    {
        var catalog = new StubPinterestCatalog
        {
            PinsToReturn =
            [
                new PinterestPin(
                    Id: "pin-123",
                    Title: "Portrait",
                    Description: null,
                    OriginalUrl:
                        "https://www.pinterest.com/pin/pin-123/",
                    ImageUrl:
                        "https://images.example/portrait.jpg")
            ]
        };

        var handler = new GetPinterestReferenceImagesHandler(catalog);

        var result = await handler.HandleAsync(
            new GetPinterestReferenceImagesQuery(
                BoardId: "board-123",
                SectionId: null));

        var image = Assert.Single(result.Images);

        Assert.Equal("Portrait", image.Description);
    }

    private sealed class StubPinterestCatalog : IPinterestCatalog
    {
        public IReadOnlyCollection<PinterestPin> PinsToReturn
        {
            get;
            init;
        } = [];

        public int PinCallCount { get; private set; }

        public string? ReceivedBoardId { get; private set; }

        public string? ReceivedSectionId { get; private set; }

        public CancellationToken ReceivedCancellationToken
        {
            get;
            private set;
        }

        public Task<IReadOnlyCollection<PinterestBoard>> GetBoardsAsync(
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult<
                IReadOnlyCollection<PinterestBoard>>([]);
        }

        public Task<IReadOnlyCollection<PinterestBoardSection>>
            GetBoardSectionsAsync(
                string boardId,
                CancellationToken cancellationToken = default)
        {
            return Task.FromResult<
                IReadOnlyCollection<PinterestBoardSection>>([]);
        }

        public Task<IReadOnlyCollection<PinterestPin>>
            GetBoardPinsAsync(
                string boardId,
                string? sectionId = null,
                CancellationToken cancellationToken = default)
        {
            PinCallCount++;
            ReceivedBoardId = boardId;
            ReceivedSectionId = sectionId;
            ReceivedCancellationToken = cancellationToken;

            return Task.FromResult(PinsToReturn);
        }
    }
}