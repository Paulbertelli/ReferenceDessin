using ReferenceDessin.Application.Photos;
using ReferenceDessin.Application.Photos.GetPhotos;

namespace ReferenceDessin.Application.Tests.Photos.GetPhotos;

public sealed class GetPhotosHandlerTests
{
    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    [InlineData(81)]
    [InlineData(100)]
    public async Task HandleAsync_WhenCountIsInvalid_ReturnsFailure(
        int invalidCount)
    {
        // Arrange
        var photoProvider = new StubPhotoProvider();
        var handler = new GetPhotosHandler(photoProvider);

        var query = new GetPhotosQuery(
            SearchTerm: "portrait",
            Count: invalidCount);

        // Act
        var result = await handler.HandleAsync(query);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(
            GetPhotosError.InvalidCount,
            result.Error);
        Assert.Empty(result.Photos);
        Assert.Equal(0, photoProvider.CallCount);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(80)]
    public async Task HandleAsync_WhenCountIsOnBoundary_ReturnsSuccess(
        int count)
    {
        // Arrange
        var photoProvider = new StubPhotoProvider();
        var handler = new GetPhotosHandler(photoProvider);

        var query = new GetPhotosQuery(
            SearchTerm: "portrait",
            Count: count);

        // Act
        var result = await handler.HandleAsync(query);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(GetPhotosError.None, result.Error);
        Assert.Equal(1, photoProvider.CallCount);
        Assert.Equal(count, photoProvider.ReceivedCount);
    }

    [Fact]
    public async Task HandleAsync_WhenSearchTermHasSpaces_NormalizesIt()
    {
        // Arrange
        var photoProvider = new StubPhotoProvider();
        var handler = new GetPhotosHandler(photoProvider);

        using var cancellationSource =
            new CancellationTokenSource();

        var query = new GetPhotosQuery(
            SearchTerm: "  chat noir  ",
            Count: 15);

        // Act
        await handler.HandleAsync(
            query,
            cancellationSource.Token);

        // Assert
        Assert.Equal("chat noir", photoProvider.ReceivedSearchTerm);
        Assert.Equal(15, photoProvider.ReceivedCount);
        Assert.Equal(
            cancellationSource.Token,
            photoProvider.ReceivedCancellationToken);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task HandleAsync_WhenSearchTermIsEmpty_PassesNull(
        string? searchTerm)
    {
        // Arrange
        var photoProvider = new StubPhotoProvider();
        var handler = new GetPhotosHandler(photoProvider);

        var query = new GetPhotosQuery(
            SearchTerm: searchTerm,
            Count: 30);

        // Act
        await handler.HandleAsync(query);

        // Assert
        Assert.Null(photoProvider.ReceivedSearchTerm);
    }

    [Fact]
    public async Task HandleAsync_WhenProviderReturnsPhotos_ReturnsThem()
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

        var query = new GetPhotosQuery(
            SearchTerm: "portrait",
            Count: 30);

        // Act
        var result = await handler.HandleAsync(query);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Same(expectedPhotos, result.Photos);
    }

    private sealed class StubPhotoProvider : IPhotoProvider
    {
        public IReadOnlyCollection<PhotoReference> PhotosToReturn
        {
            get;
            init;
        } = [];

        public int CallCount { get; private set; }

        public string? ReceivedSearchTerm { get; private set; }

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
            ReceivedSearchTerm = query;
            ReceivedCount = count;
            ReceivedCancellationToken = cancellationToken;

            return Task.FromResult(PhotosToReturn);
        }
    }
}