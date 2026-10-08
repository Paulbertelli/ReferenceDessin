using Microsoft.AspNetCore.Mvc;
using ReferenceDessin.Api.Controllers;
using ReferenceDessin.Application.Photos;
using ReferenceDessin.Application.Photos.GetPhotos;

namespace ReferenceDessin.Api.Tests.Controllers;

public sealed class PhotosControllerTests
{
    [Fact]
    public async Task Get_WhenRequestIsValid_ReturnsPhotos()
    {
        // Arrange
        IReadOnlyCollection<PhotoReference> expectedPhotos =
        [
            new PhotoReference(
                Id: 123,
                ImageUrl: "https://images.example/photo.jpeg",
                PexelsUrl: "https://www.pexels.com/photo/123",
                Photographer: "Jane Doe",
                PhotographerUrl: "https://www.pexels.com/@jane",
                Description: "Un portrait",
                AverageColor: "#AABBCC")
        ];

        var photoProvider = new StubPhotoProvider
        {
            PhotosToReturn = expectedPhotos
        };

        var handler = new GetPhotosHandler(photoProvider);
        var controller = new PhotosController(handler);

        // Act
        var result = await controller.Get(
            query: "portrait",
            count: 20);

        // Assert
        var okResult =
            Assert.IsType<OkObjectResult>(result.Result);

        Assert.Same(expectedPhotos, okResult.Value);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(81)]
    public async Task Get_WhenCountIsInvalid_ReturnsBadRequest(
        int invalidCount)
    {
        // Arrange
        var photoProvider = new StubPhotoProvider();
        var handler = new GetPhotosHandler(photoProvider);
        var controller = new PhotosController(handler);

        // Act
        var result = await controller.Get(
            query: null,
            count: invalidCount);

        // Assert
        var badRequest =
            Assert.IsType<BadRequestObjectResult>(
                result.Result);

        Assert.Equal(
            "Le nombre de photos doit être compris entre 1 et 80.",
            badRequest.Value);
    }

    private sealed class StubPhotoProvider : IPhotoProvider
    {
        public IReadOnlyCollection<PhotoReference> PhotosToReturn
        {
            get;
            init;
        } = [];

        public Task<IReadOnlyCollection<PhotoReference>> GetPhotosAsync(
            string? query,
            int count,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(PhotosToReturn);
        }
    }
}