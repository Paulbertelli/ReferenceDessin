using Microsoft.AspNetCore.Mvc;
using ReferenceDessin.Api.Controllers;
using ReferenceDessin.Application.Photos;
using ReferenceDessin.Application.Photos.SearchPexelsPhotos;

namespace ReferenceDessin.Api.Tests.Controllers;

public sealed class PhotosControllerTests
{
    [Fact]
    public async Task Get_WhenRequestIsValid_ReturnsImages()
    {
        // Arrange
        IReadOnlyCollection<ReferenceImage> expectedImages =
        [
            new ReferenceImage(
                ExternalId: "123",
                ImageUrl:
                    "https://images.example/photo.jpeg",
                SourceName: "Pexels",
                OriginalUrl:
                    "https://www.pexels.com/photo/123",
                AuthorName: "Jane Doe",
                AuthorUrl:
                    "https://www.pexels.com/@jane",
                Description: "Un portrait",
                AverageColor: "#AABBCC")
        ];

        var pexelsPhotoProvider =
            new StubPexelsPhotoProvider
            {
                ImagesToReturn = expectedImages
            };

        var handler =
            new SearchPexelsPhotosHandler(
                pexelsPhotoProvider);

        var controller =
            new PhotosController(handler);

        // Act
        var result = await controller.Get(
            searchTerm: "portrait",
            count: 20);

        // Assert
        var okResult =
            Assert.IsType<OkObjectResult>(
                result.Result);

        Assert.Same(
            expectedImages,
            okResult.Value);
    }

    [Fact]
    public async Task Get_WhenRequestIsValid_PassesParameters()
    {
        // Arrange
        var pexelsPhotoProvider =
            new StubPexelsPhotoProvider();

        var handler =
            new SearchPexelsPhotosHandler(
                pexelsPhotoProvider);

        var controller =
            new PhotosController(handler);

        using var cancellationSource =
            new CancellationTokenSource();

        // Act
        await controller.Get(
            searchTerm: "chat noir",
            count: 15,
            cancellationToken:
                cancellationSource.Token);

        // Assert
        Assert.Equal(
            1,
            pexelsPhotoProvider.CallCount);

        Assert.Equal(
            "chat noir",
            pexelsPhotoProvider.ReceivedSearchTerm);

        Assert.Equal(
            15,
            pexelsPhotoProvider.ReceivedCount);

        Assert.Equal(
            cancellationSource.Token,
            pexelsPhotoProvider
                .ReceivedCancellationToken);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    [InlineData(81)]
    [InlineData(100)]
    public async Task Get_WhenCountIsInvalid_ReturnsBadRequest(
        int invalidCount)
    {
        // Arrange
        var pexelsPhotoProvider =
            new StubPexelsPhotoProvider();

        var handler =
            new SearchPexelsPhotosHandler(
                pexelsPhotoProvider);

        var controller =
            new PhotosController(handler);

        // Act
        var result = await controller.Get(
            searchTerm: null,
            count: invalidCount);

        // Assert
        var badRequest =
            Assert.IsType<BadRequestObjectResult>(
                result.Result);

        Assert.Equal(
            "Le nombre de photos doit être compris entre 1 et 80.",
            badRequest.Value);

        Assert.Equal(
            0,
            pexelsPhotoProvider.CallCount);
    }

    private sealed class StubPexelsPhotoProvider
        : IPexelsPhotoProvider
    {
        public IReadOnlyCollection<ReferenceImage>
            ImagesToReturn
        {
            get;
            init;
        } = [];

        public int CallCount { get; private set; }

        public string? ReceivedSearchTerm
        {
            get;
            private set;
        }

        public int ReceivedCount { get; private set; }

        public CancellationToken
            ReceivedCancellationToken
        {
            get;
            private set;
        }

        public Task<
            IReadOnlyCollection<ReferenceImage>>
            SearchAsync(
                string? searchTerm,
                int count,
                CancellationToken cancellationToken =
                    default)
        {
            CallCount++;
            ReceivedSearchTerm = searchTerm;
            ReceivedCount = count;
            ReceivedCancellationToken =
                cancellationToken;

            return Task.FromResult(
                ImagesToReturn);
        }
    }
}