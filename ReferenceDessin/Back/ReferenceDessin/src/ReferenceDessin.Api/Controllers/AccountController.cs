using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ReferenceDessin.Infrastructure.Identity;

namespace ReferenceDessin.Api.Controllers;

[ApiController]
[Route("api/compte")]
[Authorize]
public sealed class AccountController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    ILogger<AccountController> logger)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user =
            await userManager.GetUserAsync(User);

        if (user is null) return Unauthorized();

        return Ok(new
        {
            estAuthentifie = true,
            nomAffiche = user.NomAffiche,
            email = user.Email,
            creeLeUtc = user.CreeLeUtc
        });
    }

    [HttpDelete]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete()
    {
        var user =
            await userManager.GetUserAsync(User);

        if (user is null) return NotFound();

        var deletionResult = await userManager.DeleteAsync(user);

        if (!deletionResult.Succeeded)
        {
            var errors = string.Join(
                ", ",
                deletionResult.Errors.Select(error =>
                    $"{error.Code}: {error.Description}"));

            logger.LogError(
                "Erreur lors de la suppression de l'utilisateur {UtilisateurId} : {Erreurs}",
                user.Id,
                errors);

            return Problem(
                title: "Impossible de supprimer le compte.",
                statusCode:
                StatusCodes.Status500InternalServerError);
        }

        await signInManager.SignOutAsync();

        Response.Cookies.Delete("XSRF-TOKEN");
        Response.Cookies.Delete("ReferenceDessin.Antiforgery");

        return NoContent();
    }
}