using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ReferenceDessin.Infrastructure.Identite;

namespace ReferenceDessin.Api.Controllers;

[ApiController]
[Route("api/compte")]
[Authorize]
public sealed class CompteController(
    UserManager<Utilisateur> gestionnaireUtilisateurs)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Obtenir()
    {
        var utilisateur =
            await gestionnaireUtilisateurs.GetUserAsync(User);

        if (utilisateur is null)
        {
            return Unauthorized();
        }

        return Ok(new
        {
            estAuthentifie = true,
            nomAffiche = utilisateur.NomAffiche,
            email = utilisateur.Email,
            creeLeUtc = utilisateur.CreeLeUtc
        });
    }
}