using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ReferenceDessin.Infrastructure.Identite;

namespace ReferenceDessin.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthentificationController(
    SignInManager<Utilisateur> gestionnaireConnexion,
    UserManager<Utilisateur> gestionnaireUtilisateurs,
    IConfiguration configuration,
    ILogger<AuthentificationController> journal)
    : ControllerBase
{
   [AllowAnonymous]
    [HttpGet("google")]
    public IActionResult ConnexionGoogle()
    {
        var urlRetour = Url.Action(
            nameof(RetourGoogle),
            "Authentification");

        if (urlRetour is null)
        {
            return Problem(
                title: "Impossible de préparer la connexion Google.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        var proprietes =
            gestionnaireConnexion
                .ConfigureExternalAuthenticationProperties(
                    GoogleDefaults.AuthenticationScheme,
                    urlRetour);

        return Challenge(
            proprietes,
            GoogleDefaults.AuthenticationScheme);
    }

    [AllowAnonymous]
    [HttpGet("google/retour")]
    public async Task<IActionResult> RetourGoogle()
    {
        var informationsConnexion =
            await gestionnaireConnexion
                .GetExternalLoginInfoAsync();

        if (informationsConnexion is null)
        {
            return Problem(
                title: "La réponse de Google est invalide.",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        var resultatConnexion =
            await gestionnaireConnexion
                .ExternalLoginSignInAsync(
                    informationsConnexion.LoginProvider,
                    informationsConnexion.ProviderKey,
                    isPersistent: true,
                    bypassTwoFactor: true);

        if (resultatConnexion.Succeeded)
        {
            await HttpContext.SignOutAsync(
                IdentityConstants.ExternalScheme);

            return RedirigerVersApplication();
        }

        var email =
            informationsConnexion.Principal
                .FindFirstValue(ClaimTypes.Email);

        if (string.IsNullOrWhiteSpace(email))
        {
            return Problem(
                title: "Google n’a pas fourni d’adresse e-mail.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var utilisateur =
            await gestionnaireUtilisateurs
                .FindByEmailAsync(email);

        var utilisateurCree = false;

        if (utilisateur is null)
        {
            var nomAffiche =
                informationsConnexion.Principal
                    .FindFirstValue(ClaimTypes.Name);

            utilisateur = new Utilisateur
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                NomAffiche = string.IsNullOrWhiteSpace(nomAffiche)
                    ? email
                    : nomAffiche,
                CreeLeUtc = DateTimeOffset.UtcNow
            };

            var resultatCreation =
                await gestionnaireUtilisateurs
                    .CreateAsync(utilisateur);

            if (!resultatCreation.Succeeded)
            {
                JournaliserErreurs(
                    "création de l’utilisateur",
                    resultatCreation.Errors);

                return Problem(
                    title: "Impossible de créer le compte.",
                    statusCode:
                        StatusCodes.Status500InternalServerError);
            }

            utilisateurCree = true;
        }

        var resultatAssociation =
            await gestionnaireUtilisateurs.AddLoginAsync(
                utilisateur,
                informationsConnexion);

        if (!resultatAssociation.Succeeded)
        {
            JournaliserErreurs(
                "association du compte Google",
                resultatAssociation.Errors);

            if (utilisateurCree)
            {
                await gestionnaireUtilisateurs
                    .DeleteAsync(utilisateur);
            }

            return Problem(
                title: "Impossible d’associer le compte Google.",
                statusCode:
                    StatusCodes.Status500InternalServerError);
        }

        await gestionnaireConnexion.SignInAsync(
            utilisateur,
            isPersistent: true);
        
        await HttpContext.SignOutAsync(
            IdentityConstants.ExternalScheme);

        return RedirigerVersApplication();
    }

    [Authorize]
    [HttpPost("deconnexion")]
    public async Task<IActionResult> Deconnexion()
    {
        await gestionnaireConnexion.SignOutAsync();

        await HttpContext.SignOutAsync(
            IdentityConstants.ExternalScheme);

        return NoContent();
    }

    private IActionResult RedirigerVersApplication()
    {
        var urlApplication =
            configuration["ApplicationCliente:Url"];

        if (string.IsNullOrWhiteSpace(urlApplication))
        {
            urlApplication = "/";
        }

        return Redirect(urlApplication);
    }

    private void JournaliserErreurs(
        string operation,
        IEnumerable<IdentityError> erreurs)
    {
        journal.LogError(
            "Échec pendant {Operation} : {Erreurs}",
            operation,
            string.Join(
                ", ",
                erreurs.Select(erreur => erreur.Description)));
    }
}