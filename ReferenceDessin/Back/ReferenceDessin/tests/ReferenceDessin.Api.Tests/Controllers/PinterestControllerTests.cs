using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ReferenceDessin.Api.Configuration;
using ReferenceDessin.Api.Controllers;
using ReferenceDessin.Application.Photos;
using ReferenceDessin.Application.Pinterest;
using ReferenceDessin.Application.Pinterest.GetPinterestReferenceImages;
using ReferenceDessin.Application.Pinterest.ListPinterestBoardSections;
using ReferenceDessin.Application.Pinterest.ListPinterestBoards;
using ReferenceDessin.Application.Tests.Stubs;

namespace ReferenceDessin.Api.Tests.Controllers;

public sealed class PinterestControllerTests
{
    [Fact]
    public async Task GetBoards_WhenPinterestIsDisabled_Returns503()
    {
        // Arrange
        var catalog = new StubPinterestCatalog();

        var controller = CreateController(catalog, false);

        // Act
        var result = await controller.GetBoards(CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result.Result);

        Assert.Equal(StatusCodes.Status503ServiceUnavailable, objectResult.StatusCode);

        var problem = Assert.IsType<ProblemDetails>(objectResult.Value);

        Assert.Equal("L’intégration Pinterest n’est pas disponible.", problem.Title);

        Assert.Equal(0, catalog.BoardCallCount);
        Assert.Equal(0, catalog.SectionCallCount);
    }

    [Fact]
    public async Task GetBoards_WhenPinterestIsEnabled_ReturnsBoards()
    {
        // Arrange
        IReadOnlyCollection<PinterestBoard> expectedBoards =
        [
            new(
                "board-123",
                "Portraits",
                "Références de portraits")
        ];

        var catalog = new StubPinterestCatalog
        {
            BoardsToReturn = expectedBoards
        };

        var controller = CreateController(catalog, true);

        // Act
        var result = await controller.GetBoards(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);

        var boards = Assert.IsAssignableFrom<IReadOnlyCollection<PinterestBoard>>(okResult.Value);

        Assert.Equal(expectedBoards, boards);
        Assert.Equal(1, catalog.BoardCallCount);
        Assert.Equal(1, catalog.SectionCallCount);
    }

    [Fact]
    public async Task GetSections_WhenRequestIsValid_ReturnsSections()
    {
        // Arrange
        IReadOnlyCollection<PinterestBoardSection> expectedSections =
        [
            new(
                "section-456",
                "Visages",
                12)
        ];

        var catalog = new StubPinterestCatalog
        {
            SectionsToReturn =
            [
                new PinterestBoardSection("section-456", "Visages")
            ],
            SectionPinCountsToReturn = new Dictionary<string, int>
            {
                ["section-456"] = 12
            }
        };

        var controller = CreateController(catalog, true);

        // Act
        var result = await controller.GetSections("board-123", CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);

        var sections = Assert.IsAssignableFrom<IReadOnlyCollection<PinterestBoardSection>>(okResult.Value);

        Assert.Equal(expectedSections, sections);

        Assert.Equal("board-123", catalog.ReceivedSectionsBoardId);

        Assert.Equal("board-123", catalog.ReceivedCountsBoardId);

        Assert.Equal(1, catalog.SectionCallCount);
        Assert.Equal(1, catalog.SectionPinCountCallCount);
    }

    [Fact]
    public async Task GetSections_WhenBoardIdIsInvalid_ReturnsBadRequest()
    {
        // Arrange
        var catalog = new StubPinterestCatalog();

        var controller = CreateController(catalog, true);

        // Act
        var result = await controller.GetSections("   ", CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);

        Assert.Equal(0, catalog.SectionCallCount);
        Assert.Equal(0, catalog.SectionPinCountCallCount);
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
                    "pin-789",
                    "Portrait",
                    "Portrait au crayon",
                    "https://www.pinterest.com/pin/pin-789/",
                    "https://images.example/portrait.jpg")
            ]
        };

        var controller = CreateController(catalog, true);

        // Act
        var result = await controller.GetSectionImages("board-123", "section-456", CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);

        var images = Assert.IsAssignableFrom<IReadOnlyCollection<ReferenceImage>>(okResult.Value);

        var image = Assert.Single(images);

        Assert.Equal("pin-789", image.ExternalId);

        Assert.Equal("https://images.example/portrait.jpg", image.ImageUrl);

        Assert.Equal("Pinterest", image.SourceName);

        Assert.Equal("https://www.pinterest.com/pin/pin-789/", image.OriginalUrl);

        Assert.Null(image.AuthorName);
        Assert.Null(image.AuthorUrl);

        Assert.Equal("Portrait au crayon", image.Description);

        Assert.Null(image.AverageColor);

        Assert.Equal("board-123", catalog.ReceivedPinsBoardId);

        Assert.Equal("section-456", catalog.ReceivedSectionId);

        Assert.Equal(1, catalog.PinCallCount);
    }

    [Fact]
    public async Task GetBoardPreviewImages_WhenCountIsOmitted_UsesFour()
    {
        // Arrange
        var catalog = new StubPinterestCatalog();

        var controller = CreateController(catalog, true);

        // Act
        var result = await controller.GetBoardPreviewImages("board-123", cancellationToken: CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(4, catalog.ReceivedMaximumCount);
        Assert.Equal(1, catalog.PinCallCount);

        Assert.Equal("board-123", catalog.ReceivedPinsBoardId);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    public async Task GetBoardPreviewImages_WhenCountIsInvalid_ReturnsBadRequest(
        int count)
    {
        // Arrange
        var catalog = new StubPinterestCatalog();

        var controller = CreateController(catalog, true);

        // Act
        var result = await controller.GetBoardPreviewImages("board-123", count, CancellationToken.None);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);

        Assert.Equal("Le nombre d’images doit être compris entre 1 et 4.", badRequest.Value);

        Assert.Equal(0, catalog.PinCallCount);
    }

    private static PinterestController CreateController(IPinterestCatalog catalog, bool enabled)
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
}