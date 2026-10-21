using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ReferenceDessin.Api.Configuration;
using ReferenceDessin.Application.Photos;
using ReferenceDessin.Application.Pinterest;
using ReferenceDessin.Application.Pinterest.GetPinterestReferenceImages;
using ReferenceDessin.Application.Pinterest.ListPinterestBoards;
using ReferenceDessin.Application.Pinterest.ListPinterestBoardSections;

namespace ReferenceDessin.Api.Controllers;

[ApiController]
[Route("api/pinterest")]
public sealed class PinterestController(
    ListPinterestBoardsHandler listBoardsHandler,
    ListPinterestBoardSectionsHandler listSectionsHandler,
    GetPinterestReferenceImagesHandler getImagesHandler,
    IOptions<PinterestFeatureOptions> featureOptions)
    : ControllerBase
{
    [HttpGet("boards")]
    public async Task<ActionResult<
        IReadOnlyCollection<PinterestBoard>>> GetBoards(
        CancellationToken cancellationToken)
    {
        if (!featureOptions.Value.Enabled)
        {
            return PinterestUnavailable();
        }

        var boards = await listBoardsHandler.HandleAsync(
            cancellationToken);

        return Ok(boards);
    }

    [HttpGet("boards/{boardId}/sections")]
    public async Task<ActionResult<
        IReadOnlyCollection<PinterestBoardSection>>> GetSections(
        string boardId,
        CancellationToken cancellationToken)
    {
        if (!featureOptions.Value.Enabled)
        {
            return PinterestUnavailable();
        }

        var result = await listSectionsHandler.HandleAsync(
            new ListPinterestBoardSectionsQuery(boardId),
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(
                "L’identifiant du tableau Pinterest est invalide.");
        }

        return Ok(result.Sections);
    }

    [HttpGet("boards/{boardId}/images")]
    public Task<ActionResult<
        IReadOnlyCollection<ReferenceImage>>> GetBoardImages(
        string boardId,
        CancellationToken cancellationToken)
    {
        return GetImages(
            boardId,
            sectionId: null,
            cancellationToken);
    }

    [HttpGet(
        "boards/{boardId}/sections/{sectionId}/images")]
    public Task<ActionResult<
        IReadOnlyCollection<ReferenceImage>>> GetSectionImages(
        string boardId,
        string sectionId,
        CancellationToken cancellationToken)
    {
        return GetImages(
            boardId,
            sectionId,
            cancellationToken);
    }

    private async Task<ActionResult<
        IReadOnlyCollection<ReferenceImage>>> GetImages(
        string boardId,
        string? sectionId,
        CancellationToken cancellationToken)
    {
        if (!featureOptions.Value.Enabled)
        {
            return PinterestUnavailable();
        }

        var result = await getImagesHandler.HandleAsync(
            new GetPinterestReferenceImagesQuery(
                boardId,
                sectionId),
            cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(
                "L’identifiant du tableau Pinterest est invalide.");
        }

        return Ok(result.Images);
    }

    private ObjectResult PinterestUnavailable()
    {
        return Problem(
            statusCode:
                StatusCodes.Status503ServiceUnavailable,
            title:
                "L’intégration Pinterest n’est pas disponible.",
            detail:
                "L’accès à Pinterest n’est pas encore activé.");
    }
}