using System.Net;
using System.Text;
using ReferenceDessin.Infrastructure.Pinterest;

namespace ReferenceDessin.Infrastructure.Tests.Pinterest;

public sealed class PinterestClientTests
{
    [Fact]
    public async Task GetBoardsAsync_WhenOnePageIsReturned_MapsBoards()
    {
        // Arrange
        using var httpClient = CreateHttpClient(_ =>
            CreateJsonResponse(
                """
                {
                  "items": [
                    {
                      "id": "123",
                      "name": "Portraits",
                      "description": "Références de portraits"
                    },
                    {
                      "id": "456",
                      "name": "Anatomie",
                      "description": null
                    }
                  ],
                  "bookmark": null
                }
                """));

        var client = new PinterestClient(httpClient);

        // Act
        var boards = await client.GetBoardsAsync();

        // Assert
        Assert.Collection(
            boards,
            board =>
            {
                Assert.Equal("123", board.Id);
                Assert.Equal("Portraits", board.Name);
                Assert.Equal(
                    "Références de portraits",
                    board.Description);
            },
            board =>
            {
                Assert.Equal("456", board.Id);
                Assert.Equal("Anatomie", board.Name);
                Assert.Null(board.Description);
            });
    }

    [Fact]
    public async Task GetBoardsAsync_WhenResponseIsPaginated_LoadsEveryPage()
    {
        // Arrange
        var requestedUris = new List<string>();

        using var httpClient = CreateHttpClient(request =>
        {
            var uri = request.RequestUri!.AbsoluteUri;
            requestedUris.Add(uri);

            if (requestedUris.Count == 1)
            {
                return CreateJsonResponse(
                    """
                    {
                      "items": [
                        {
                          "id": "123",
                          "name": "Portraits",
                          "description": null
                        }
                      ],
                      "bookmark": "page suivante"
                    }
                    """);
            }

            return CreateJsonResponse(
                """
                {
                  "items": [
                    {
                      "id": "456",
                      "name": "Anatomie",
                      "description": null
                    }
                  ],
                  "bookmark": null
                }
                """);
        });

        var client = new PinterestClient(httpClient);

        // Act
        var boards = await client.GetBoardsAsync();

        // Assert
        Assert.Equal(2, boards.Count);

        Assert.Equal(
            [
                "https://api.pinterest.com/v5/boards?page_size=100",
                "https://api.pinterest.com/v5/boards?page_size=100" +
                "&bookmark=page%20suivante"
            ],
            requestedUris);
    }

    [Fact]
    public async Task GetBoardsAsync_WhenResponseIsNull_ReturnsEmptyCollection()
    {
        // Arrange
        using var httpClient = CreateHttpClient(_ =>
            CreateJsonResponse("null"));

        var client = new PinterestClient(httpClient);

        // Act
        var boards = await client.GetBoardsAsync();

        // Assert
        Assert.Empty(boards);
    }

    [Fact]
    public async Task GetBoardsAsync_WhenPinterestReturnsError_Throws()
    {
        // Arrange
        using var httpClient = CreateHttpClient(_ =>
            new HttpResponseMessage(
                HttpStatusCode.Unauthorized));

        var client = new PinterestClient(httpClient);

        // Act
        var action = () => client.GetBoardsAsync();

        // Assert
        await Assert.ThrowsAsync<HttpRequestException>(
            action);
    }

    private static HttpClient CreateHttpClient(
        Func<HttpRequestMessage, HttpResponseMessage>
            responseFactory)
    {
        var handler = new StubHttpMessageHandler(
            responseFactory);

        return new HttpClient(handler)
        {
            BaseAddress = new Uri(
                "https://api.pinterest.com/v5/")
        };
    }

    private static HttpResponseMessage CreateJsonResponse(
        string json)
    {
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json")
        };
    }

    private sealed class StubHttpMessageHandler(
        Func<HttpRequestMessage, HttpResponseMessage>
            responseFactory)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            return Task.FromResult(
                responseFactory(request));
        }
    }
    
    [Fact]
    public async Task GetBoardSectionsAsync_WhenResponseIsValid_MapsSections()
    {
        // Arrange
        Uri? requestedUri = null;

        using var httpClient = CreateHttpClient(request =>
        {
            requestedUri = request.RequestUri;

            return CreateJsonResponse(
                """
                {
                  "items": [
                    {
                      "id": "section-123",
                      "name": "Portraits"
                    }
                  ],
                  "bookmark": null
                }
                """);
        });

        var client = new PinterestClient(httpClient);

        // Act
        var sections = await client.GetBoardSectionsAsync(
            "board-456");

        // Assert
        var section = Assert.Single(sections);

        Assert.Equal("section-123", section.Id);
        Assert.Equal("Portraits", section.Name);

        Assert.Equal(
            "https://api.pinterest.com/v5/" +
            "boards/board-456/sections?page_size=100",
            requestedUri?.AbsoluteUri);
    }
    
    [Fact]
    public async Task GetBoardSectionsAsync_WhenBookmarkExists_LoadsNextPage()
    {
        // Arrange
        var requestedUris = new List<string>();

        using var httpClient = CreateHttpClient(request =>
        {
            requestedUris.Add(request.RequestUri!.AbsoluteUri);

            if (requestedUris.Count == 1)
            {
                return CreateJsonResponse(
                    """
                    {
                      "items": [
                        {
                          "id": "section-1",
                          "name": "Portraits"
                        }
                      ],
                      "bookmark": "next page"
                    }
                    """);
            }

            return CreateJsonResponse(
                """
                {
                  "items": [
                    {
                      "id": "section-2",
                      "name": "Animaux"
                    }
                  ],
                  "bookmark": null
                }
                """);
        });

        var client = new PinterestClient(httpClient);

        // Act
        var sections = await client.GetBoardSectionsAsync(
            "board/123");

        // Assert
        Assert.Collection(
            sections,
            section =>
            {
                Assert.Equal("section-1", section.Id);
                Assert.Equal("Portraits", section.Name);
            },
            section =>
            {
                Assert.Equal("section-2", section.Id);
                Assert.Equal("Animaux", section.Name);
            });

        Assert.Equal(2, requestedUris.Count);

        Assert.Equal(
            "https://api.pinterest.com/v5/" +
            "boards/board%2F123/sections?page_size=100",
            requestedUris[0]);

        Assert.Equal(
            "https://api.pinterest.com/v5/" +
            "boards/board%2F123/sections?page_size=100" +
            "&bookmark=next%20page",
            requestedUris[1]);
    }
}