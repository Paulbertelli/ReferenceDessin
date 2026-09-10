using Microsoft.AspNetCore.Mvc;
using ReferenceDessin.Api.Controllers;
using ReferenceDessin.Application.Photos;
using Xunit;

namespace ReferenceDessin.Api.Tests.Controllers;

public sealed class PhotosControllerTests
{
    [Fact]
    public async Task Get_WhenParametersAreValid_ReturnsPhotos()
    {
        // Arrange
        IReadOnlyCollection<PhotoReference> expectedPhotos =
        [
            new PhotoReference(
                Id: 123,
                ImageUrl: "https://images.pexels.com/photo.jpeg",
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

        var controller = new PhotosController(photoProvider);

        // Act
        var result = await controller.Get(
            query: "portrait",
            count: 20);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);

        Assert.Same(expectedPhotos, okResult.Value);
    }

    [Fact]
    public async Task Get_WhenParametersAreValid_PassesThemToProvider()
    {
        // Arrange
        var photoProvider = new StubPhotoProvider();
        var controller = new PhotosController(photoProvider);

        using var cancellationSource =
            new CancellationTokenSource();

        // Act
        await controller.Get(
            query: "chat noir",
            count: 15,
            cancellationToken: cancellationSource.Token);

        // Assert
        Assert.Equal(1, photoProvider.CallCount);
        Assert.Equal("chat noir", photoProvider.ReceivedQuery);
        Assert.Equal(15, photoProvider.ReceivedCount);
        Assert.Equal(
            cancellationSource.Token,
            photoProvider.ReceivedCancellationToken);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(81)]
    [InlineData(100)]
    public async Task Get_WhenCountIsInvalid_ReturnsBadRequest(
        int invalidCount)
    {
        // Arrange
        var photoProvider = new StubPhotoProvider();
        var controller = new PhotosController(photoProvider);

        // Act
        var result = await controller.Get(
            query: null,
            count: invalidCount);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(
            result.Result);

        Assert.Equal(
            "Le nombre de photos doit être compris entre 1 et 80.",
            badRequest.Value);

        Assert.Equal(0, photoProvider.CallCount);
    }

    private sealed class StubPhotoProvider : IPhotoProvider
    {
        public IReadOnlyCollection<PhotoReference> PhotosToReturn
        {
            get;
            init;
        } = [];

        public int CallCount { get; private set; }

        public string? ReceivedQuery { get; private set; }

        public int ReceivedCount { get; private set; }

        public CancellationToken ReceivedCancellationToken
        {
            get;
            private set;
        }

        public Task<IReadOnlyCollection<PhotoReference>> GetPhotosAsync(
            string? query,
            int count,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            ReceivedQuery = query;
            ReceivedCount = count;
            ReceivedCancellationToken = cancellationToken;

            return Task.FromResult(PhotosToReturn);
        }
    }
}