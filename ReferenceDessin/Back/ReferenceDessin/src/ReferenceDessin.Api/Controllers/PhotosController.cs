using Microsoft.AspNetCore.Mvc;
using ReferenceDessin.Application.Photos;

namespace ReferenceDessin.Api.Controllers;

[ApiController]
[Route("api/photos")]
public sealed class PhotosController(IPhotoProvider photoProvider): ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<PhotoReference>>> Get(
        [FromQuery] string? query,
        [FromQuery] int count = 30,
        CancellationToken cancellationToken = default)
    {
        if (count is < 1 or > 80)
        {
            return BadRequest(
                "Le nombre de photos doit être compris entre 1 et 80.");
        }

        var photos = await photoProvider.GetPhotosAsync(
            query,
            count,
            cancellationToken);

        return Ok(photos);
    }
}