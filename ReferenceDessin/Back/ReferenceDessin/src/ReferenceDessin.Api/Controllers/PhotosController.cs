using Microsoft.AspNetCore.Mvc;
using ReferenceDessin.Application.Photos;
using ReferenceDessin.Application.Photos.GetPhotos;

namespace ReferenceDessin.Api.Controllers;

[ApiController]
[Route("api/photos")]
public sealed class PhotosController(GetPhotosHandler getPhotosHandler) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<PhotoReference>>> Get(
        [FromQuery] string? query,
        [FromQuery] int count = 30,
        CancellationToken cancellationToken = default)
    {
        var result = await getPhotosHandler.HandleAsync(
            new GetPhotosQuery(query, count),
            cancellationToken);

        if (!result.IsSuccess)
        {
            return result.Error switch
            {
                GetPhotosError.InvalidCount => BadRequest(
                    "Le nombre de photos doit être compris entre 1 et 80."),

                _ => Problem(
                    title: "Impossible de récupérer les photos.",
                    statusCode:
                    StatusCodes.Status500InternalServerError)
            };
        }

        return Ok(result.Photos);
    }
}