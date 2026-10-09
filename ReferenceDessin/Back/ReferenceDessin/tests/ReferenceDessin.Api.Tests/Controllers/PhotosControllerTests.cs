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
                ImageUrl: "https://images.example/photo.jpeg",
                SourceName: "Pexels",
                OriginalUrl: "https://www.pexels.com/photo/123",
                AuthorName: "Jane Doe",
                AuthorUrl: "https://www.pexels.com/@jane",
                Description: "Un portrait",
                AverageColor: "#AABBCC")
        ];

        var pexelsPhotoProvider = new StubPexelsPhotoProvider
        {
            ImagesToReturn = expectedImages
        };

        var handler = new SearchPexelsPhotosHandler(pexelsPhotoProvider);
        var controller = new PhotosController(handler);

        // Act
        var result = await controller.Get(
            searchTerm: "portrait",
            count: 20);

        // Assert
        var okResult =
            Assert.IsType<OkObjectResult>(result.Result);

        Assert.Same(expectedImages, okResult.Value);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(81)]
    public async Task Get_WhenCountIsInvalid_ReturnsBadRequest(
        int invalidCount)
    {
        // Arrange
        var pexelsPhotoProvider = new StubPexelsPhotoProvider();
        var handler = new SearchPexelsPhotosHandler(pexelsPhotoProvider);
        var controller = new PhotosController(handler);

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
    }

    private sealed class StubPexelsPhotoProvider : IPexelsPhotoProvider
    {
        public IReadOnlyCollection<ReferenceImage> ImagesToReturn
        {
            get;
            init;
        } = [];

        public Task<IReadOnlyCollection<ReferenceImage>> SearchAsync(
            string? searchTerm,
            int count,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(ImagesToReturn);
        }
    }
}