using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ReferenceDessin.Api.Configuration;
using ReferenceDessin.Api.Controllers;
using ReferenceDessin.Application.Photos;
using ReferenceDessin.Application.Pinterest;
using ReferenceDessin.Application.Pinterest
    .GetPinterestReferenceImages;
using ReferenceDessin.Application.Pinterest
    .ListPinterestBoardSections;
using ReferenceDessin.Application.Pinterest
    .ListPinterestBoards;

namespace ReferenceDessin.Api.Tests.Controllers;

public sealed class PinterestControllerTests
{
    [Fact]
    public async Task GetBoards_WhenPinterestIsDisabled_Returns503()
    {
        // Arrange
        var catalog = new StubPinterestCatalog();

        var controller = CreateController(
            catalog,
            enabled: false);

        // Act
        var result = await controller.GetBoards(
            CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(
            result.Result);

        Assert.Equal(
            StatusCodes.Status503ServiceUnavailable,
            objectResult.StatusCode);

        var problem = Assert.IsType<ProblemDetails>(
            objectResult.Value);

        Assert.Equal(
            "L’intégration Pinterest n’est pas disponible.",
            problem.Title);

        Assert.Equal(0, catalog.BoardCallCount);
    }

    [Fact]
    public async Task GetBoards_WhenPinterestIsEnabled_ReturnsBoards()
    {
        // Arrange
        IReadOnlyCollection<PinterestBoard> expectedBoards =
        [
            new PinterestBoard(
                Id: "board-123",
                Name: "Portraits",
                Description: "Références de portraits")
        ];

        var catalog = new StubPinterestCatalog
        {
            BoardsToReturn = expectedBoards
        };

        var controller = CreateController(
            catalog,
            enabled: true);

        // Act
        var result = await controller.GetBoards(
            CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(
            result.Result);

        Assert.Same(expectedBoards, okResult.Value);
        Assert.Equal(1, catalog.BoardCallCount);
    }

    [Fact]
    public async Task GetSections_WhenRequestIsValid_ReturnsSections()
    {
        // Arrange
        IReadOnlyCollection<PinterestBoardSection> expectedSections =
        [
            new PinterestBoardSection(
                Id: "section-456",
                Name: "Visages")
        ];

        var catalog = new StubPinterestCatalog
        {
            SectionsToReturn = expectedSections
        };

        var controller = CreateController(
            catalog,
            enabled: true);

        // Act
        var result = await controller.GetSections(
            "board-123",
            CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(
            result.Result);

        Assert.Same(expectedSections, okResult.Value);
        Assert.Equal("board-123", catalog.ReceivedBoardId);
        Assert.Equal(1, catalog.SectionCallCount);
    }

    [Fact]
    public async Task GetSections_WhenBoardIdIsInvalid_ReturnsBadRequest()
    {
        // Arrange
        var catalog = new StubPinterestCatalog();

        var controller = CreateController(
            catalog,
            enabled: true);

        // Act
        var result = await controller.GetSections(
            "   ",
            CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(
            result.Result);

        Assert.Equal(0, catalog.SectionCallCount);
    }

    [Fact]
    public async Task GetSectionImages_WhenRequestIsValid_ReturnsImages()
    {
        // Arrange
        var catalog = new StubPinterestCatalog
        {
            PinsToReturn =
            [
                new PinterestPin(
                    Id: "pin-789",
                    Title: "Portrait",
                    Description: "Portrait au crayon",
                    OriginalUrl:
                        "https://www.pinterest.com/pin/pin-789/",
                    ImageUrl:
                        "https://images.example/portrait.jpg")
            ]
        };

        var controller = CreateController(
            catalog,
            enabled: true);

        // Act
        var result = await controller.GetSectionImages(
            "board-123",
            "section-456",
            CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(
            result.Result);

        var images = Assert.IsAssignableFrom<
            IReadOnlyCollection<ReferenceImage>>(
                okResult.Value);

        var image = Assert.Single(images);

        Assert.Equal("pin-789", image.ExternalId);
        Assert.Equal(
            "https://images.example/portrait.jpg",
            image.ImageUrl);
        Assert.Equal("Pinterest", image.SourceName);
        Assert.Equal(
            "https://www.pinterest.com/pin/pin-789/",
            image.OriginalUrl);
        Assert.Null(image.AuthorName);
        Assert.Null(image.AuthorUrl);
        Assert.Equal(
            "Portrait au crayon",
            image.Description);
        Assert.Null(image.AverageColor);

        Assert.Equal("board-123", catalog.ReceivedBoardId);
        Assert.Equal("section-456", catalog.ReceivedSectionId);
        Assert.Equal(1, catalog.PinCallCount);
    }
    
    [Fact]
    public async Task GetBoardPreviewImages_WhenCountIsOmitted_UsesFour()
    {
        // Arrange
        var catalog = new StubPinterestCatalog();

        var controller = CreateController(
            catalog,
            enabled: true);

        // Act
        var result = await controller.GetBoardPreviewImages(
            boardId: "board-123",
            cancellationToken: CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(4, catalog.ReceivedMaximumCount);
        Assert.Equal(1, catalog.PinCallCount);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    public async Task GetBoardPreviewImages_WhenCountIsInvalid_ReturnsBadRequest(
        int count)
    {
        // Arrange
        var catalog = new StubPinterestCatalog();

        var controller = CreateController(
            catalog,
            enabled: true);

        // Act
        var result = await controller.GetBoardPreviewImages(
            boardId: "board-123",
            count: count,
            cancellationToken: CancellationToken.None);

        // Assert
        var badRequest =
            Assert.IsType<BadRequestObjectResult>(
                result.Result);

        Assert.Equal(
            "Le nombre d’images doit être compris entre 1 et 4.",
            badRequest.Value);

        Assert.Equal(0, catalog.PinCallCount);
    }

    private static PinterestController CreateController(
        IPinterestCatalog catalog,
        bool enabled)
    {
        return new PinterestController(
            new ListPinterestBoardsHandler(catalog),
            new ListPinterestBoardSectionsHandler(catalog),
            new GetPinterestReferenceImagesHandler(catalog),
            Options.Create(
                new PinterestFeatureOptions
                {
                    Enabled = enabled
                }));
    }

    private sealed class StubPinterestCatalog : IPinterestCatalog
    {
        public IReadOnlyCollection<PinterestBoard> BoardsToReturn
        {
            get;
            init;
        } = [];

        public IReadOnlyCollection<PinterestBoardSection>
            SectionsToReturn
        {
            get;
            init;
        } = [];

        public IReadOnlyCollection<PinterestPin> PinsToReturn
        {
            get;
            init;
        } = [];

        public int BoardCallCount { get; private set; }

        public int SectionCallCount { get; private set; }

        public int PinCallCount { get; private set; }

        public string? ReceivedBoardId { get; private set; }

        public string? ReceivedSectionId { get; private set; }
        
        public int? ReceivedMaximumCount { get; private set; }

        public Task<IReadOnlyCollection<PinterestBoard>>
            GetBoardsAsync(
                CancellationToken cancellationToken = default)
        {
            BoardCallCount++;

            return Task.FromResult(BoardsToReturn);
        }

        public Task<IReadOnlyCollection<PinterestBoardSection>>
            GetBoardSectionsAsync(
                string boardId,
                CancellationToken cancellationToken = default)
        {
            SectionCallCount++;
            ReceivedBoardId = boardId;

            return Task.FromResult(SectionsToReturn);
        }

        public Task<IReadOnlyCollection<PinterestPin>>
            GetBoardPinsAsync(
                string boardId,
                string? sectionId = null,
                int? maximumCount = null,
                CancellationToken cancellationToken = default)
        {
            PinCallCount++;
            ReceivedBoardId = boardId;
            ReceivedMaximumCount = maximumCount;
            ReceivedSectionId = sectionId;

            return Task.FromResult(PinsToReturn);
        }
    }
}