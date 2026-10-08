using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ReferenceDessin.Infrastructure.Identity;

namespace ReferenceDessin.Api.Controllers;

[ApiController]
[Route("api/compte")]
[Authorize]
public sealed class CompteController(
    UserManager<ApplicationUser> gestionnaireUtilisateurs,
    SignInManager<ApplicationUser> gestionnaireConnexion,
    ILogger<CompteController> journal)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Obtenir()
    {
        var utilisateur =
            await gestionnaireUtilisateurs.GetUserAsync(User);

        if (utilisateur is null) return Unauthorized();

        return Ok(new
        {
            estAuthentifie = true,
            nomAffiche = utilisateur.NomAffiche,
            email = utilisateur.Email,
            creeLeUtc = utilisateur.CreeLeUtc
        });
    }

    [HttpDelete]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Supprimer()
    {
        var utilisateur =
            await gestionnaireUtilisateurs.GetUserAsync(User);

        if (utilisateur is null) return NotFound();

        var resultatSuppression = await gestionnaireUtilisateurs.DeleteAsync(utilisateur);

        if (!resultatSuppression.Succeeded)
        {
            var erreurs = string.Join(
                ", ",
                resultatSuppression.Errors.Select(erreur =>
                    $"{erreur.Code}: {erreur.Description}"));

            journal.LogError(
                "Erreur lors de la suppression de l'utilisateur {UtilisateurId} : {Erreurs}",
                utilisateur.Id,
                erreurs);

            return Problem(
                title: "Impossible de supprimer le compte.",
                statusCode:
                StatusCodes.Status500InternalServerError);
        }

        await gestionnaireConnexion.SignOutAsync();

        Response.Cookies.Delete("XSRF-TOKEN");
        Response.Cookies.Delete("ReferenceDessin.Antiforgery");

        return NoContent();
    }
}