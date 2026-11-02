using ReferenceDessin.Application.Photos;
using ReferenceDessin.Application.Photos.SearchPexelsPhotos;

namespace ReferenceDessin.Application.Tests.Photos.SearchPexelsPhotos;

public sealed class SearchPexelsPhotosHandlerTests
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
        var pexelsPhotoProvider = new StubPexelsPhotoProvider();
        var handler = new SearchPexelsPhotosHandler(pexelsPhotoProvider);

        var query = new SearchPexelsPhotosQuery(
            SearchTerm: "portrait",
            Count: invalidCount);

        // Act
        var result = await handler.HandleAsync(query);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(
            SearchPexelsPhotosError.InvalidCount,
            result.Error);
        Assert.Empty(result.Images);
        Assert.Equal(0, pexelsPhotoProvider.CallCount);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(80)]
    public async Task HandleAsync_WhenCountIsOnBoundary_ReturnsSuccess(
        int count)
    {
        // Arrange
        var pexelsPhotoProvider = new StubPexelsPhotoProvider();
        var handler = new SearchPexelsPhotosHandler(pexelsPhotoProvider);

        var query = new SearchPexelsPhotosQuery(
            SearchTerm: "portrait",
            Count: count);

        // Act
        var result = await handler.HandleAsync(query);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(SearchPexelsPhotosError.None, result.Error);
        Assert.Equal(1, pexelsPhotoProvider.CallCount);
        Assert.Equal(count, pexelsPhotoProvider.ReceivedCount);
    }

    [Fact]
    public async Task HandleAsync_WhenSearchTermHasSpaces_NormalizesIt()
    {
        // Arrange
        var pexelsPhotoProvider = new StubPexelsPhotoProvider();
        var handler = new SearchPexelsPhotosHandler(pexelsPhotoProvider);

        using var cancellationSource =
            new CancellationTokenSource();

        var query = new SearchPexelsPhotosQuery(
            SearchTerm: "  chat noir  ",
            Count: 15);

        // Act
        await handler.HandleAsync(
            query,
            cancellationSource.Token);

        // Assert
        Assert.Equal("chat noir", pexelsPhotoProvider.ReceivedSearchTerm);
        Assert.Equal(15, pexelsPhotoProvider.ReceivedCount);
        Assert.Equal(
            cancellationSource.Token,
            pexelsPhotoProvider.ReceivedCancellationToken);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task HandleAsync_WhenSearchTermIsEmpty_PassesNull(
        string? searchTerm)
    {
        // Arrange
        var pexelsPhotoProvider = new StubPexelsPhotoProvider();
        var handler = new SearchPexelsPhotosHandler(pexelsPhotoProvider);

        var query = new SearchPexelsPhotosQuery(
            SearchTerm: searchTerm,
            Count: 30);

        // Act
        await handler.HandleAsync(query);

        // Assert
        Assert.Null(pexelsPhotoProvider.ReceivedSearchTerm);
    }

    [Fact]
    public async Task HandleAsync_WhenPexelsProviderReturnsImages_ReturnsThem()
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

        var query = new SearchPexelsPhotosQuery(
            SearchTerm: "portrait",
            Count: 30);

        // Act
        var result = await handler.HandleAsync(query);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Same(expectedImages, result.Images);
    }

    private sealed class StubPexelsPhotoProvider : IPexelsPhotoProvider
    {
        public IReadOnlyCollection<ReferenceImage> ImagesToReturn
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

        public Task<IReadOnlyCollection<ReferenceImage>> SearchAsync(
            string? searchTerm,
            int count,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            ReceivedSearchTerm = searchTerm;
            ReceivedCount = count;
            ReceivedCancellationToken = cancellationToken;

            return Task.FromResult(ImagesToReturn);
        }
    }
}