using Microsoft.AspNetCore.Mvc;
using ReferenceDessin.Application.Photos;
using ReferenceDessin.Application.Photos.SearchPexelsPhotos;

namespace ReferenceDessin.Api.Controllers;

[ApiController]
[Route("api/photos")]
public sealed class PhotosController(SearchPexelsPhotosHandler searchPexelsPhotosHandler) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<ReferenceImage>>> Get(
        [FromQuery(Name = "query")] string? searchTerm,
        [FromQuery] int count = 30,
        CancellationToken cancellationToken = default)
    {
        var result = await searchPexelsPhotosHandler.HandleAsync(
            new SearchPexelsPhotosQuery(searchTerm, count),
            cancellationToken);

        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                SearchPexelsPhotosError.InvalidCount => BadRequest(
                    "Le nombre de photos doit être compris entre 1 et 80."),

                _ => Problem(
                    title: "Impossible de récupérer les photos.",
                    statusCode:
                    StatusCodes.Status500InternalServerError)
            };
        }

        return Ok(result.Images);
    }
}