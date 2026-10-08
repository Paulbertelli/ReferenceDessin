using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ReferenceDessin.Infrastructure.Identity;

namespace ReferenceDessin.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthenticationController(
    SignInManager<ApplicationUser> gestionnaireConnexion,
    UserManager<ApplicationUser> gestionnaireUtilisateurs,
    IConfiguration configuration,
    ILogger<AuthenticationController> journal)
    : ControllerBase
{
   [AllowAnonymous]
    [HttpGet("google")]
    public IActionResult ConnexionGoogle()
    {
        // Génère l'adresse correspondant à l'action RetourGoogle : /api/auth/google/retour
        var urlRetour = Url.Action(
            nameof(RetourGoogle),
            "Authentication");
        
        // On traite tout de même proprement le cas d'un échec.
        if (urlRetour is null)
        {
            return Problem(
                title: "Impossible de préparer la connexion Google.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        // Cette méthode crée les informations nécessaires au cookie de corrélation,
        // et après /signin-google ,ASP.NET redirigera vers urlRetour.
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
        // Récupère les informations placées par le middleware Google dans le cookie externe temporaire.
        var informationsConnexion =
            await gestionnaireConnexion
                .GetExternalLoginInfoAsync();
        
        // Si ces informations sont absentes, le parcours Google est incomplet, expiré ou invalide.
        if (informationsConnexion is null)
        {
            return Problem(
                title: "La réponse de Google est invalide.",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        // Tente de retrouver un utilisateur déjà associé au compte Google.
        // Identity recherche principalement dans la table AspNetUserLogins avec :
        // - LoginProvider = "Google"
        // - ProviderKey = identifiant Google stable
        var resultatConnexion =
            await gestionnaireConnexion
                .ExternalLoginSignInAsync(
                    informationsConnexion.LoginProvider,
                    informationsConnexion.ProviderKey,
                    isPersistent: true,
                    bypassTwoFactor: true);

        // Si l'association Google existe déjà,
        // Identity a créé le cookie final de connexion.
        if (resultatConnexion.Succeeded)
        {
            // Le cookie externe temporaire n'est plus utile.
            await HttpContext.SignOutAsync(
                IdentityConstants.ExternalScheme);
            
            // Retour vers l'application Angular.
            return RedirigerVersApplication();
        }

        // Si l'association n'existe pas, il s'agit d'une première connexion.
        // On récupère l'adresse e-mail dans les claims Google.
        var email =
            informationsConnexion.Principal
                .FindFirstValue(ClaimTypes.Email);

        // Sans adresse e-mail, nous ne pouvons pas créer correctement le compte local.
        if (string.IsNullOrWhiteSpace(email))
        {
            return Problem(
                title: "Google n’a pas fourni d’adresse e-mail.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        // Cherche si un utilisateur possède déjà cette adresse afin d'éviter les doublons.
        var utilisateur =
            await gestionnaireUtilisateurs
                .FindByEmailAsync(email);

        // utilisateurCree permettra de savoir si nous devons supprimer l'utilisateur en cas d'échec de l'association Google.
        var utilisateurCree = false;

        // Si aucun compte local n'existe, il faut en créer un.
        if (utilisateur is null)
        {
            // Récupère le nom complet fourni par Google.
            var nomAffiche =
                informationsConnexion.Principal
                    .FindFirstValue(ClaimTypes.Name);

            // Création d'une instance de notre entité Utilisateur.
            utilisateur = new ApplicationUser
            {
                // Comme nous n'avons pas de pseudonyme, nous utilisons l'adresse e-mail.
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                //Pareil ici, si Google ne donne aucun nom, on utilise l'e-mail comme solution de secours.
                NomAffiche = string.IsNullOrWhiteSpace(nomAffiche)
                    ? email
                    : nomAffiche,
                CreeLeUtc = DateTimeOffset.UtcNow
            };

            //crée le compte dans la base de données.
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

        // Associe maintenant le compte Google
        // au compte Référence Dessin.
        // Cela crée une ligne dans AspNetUserLogins.
        var resultatAssociation =
            await gestionnaireUtilisateurs.AddLoginAsync(
                utilisateur,
                informationsConnexion);

        if (!resultatAssociation.Succeeded)
        {
            JournaliserErreurs(
                "association du compte Google",
                resultatAssociation.Errors);

            // Si nous venons juste de créer l'utilisateur,
            // mais que l'association Google échoue,
            // nous supprimons ce compte incomplet.
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
        
        // L'utilisateur et son association Google existent.
        // Cette méthode crée le cookie final : ReferenceDessin.Authentification
        await gestionnaireConnexion.SignInAsync(
            utilisateur,
            isPersistent: true);
        
        // Supprime le cookie Identity.External, devenu inutile.
        await HttpContext.SignOutAsync(
            IdentityConstants.ExternalScheme);
        
        // Redirige le navigateur vers Angular.
        return RedirigerVersApplication();
    }

    [Authorize]
    [HttpPost("deconnexion")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Deconnexion()
    {
        // Supprime le cookie principal d'authentification.
        await gestionnaireConnexion.SignOutAsync();

        // Supprime également un éventuel cookie externe restant.
        await HttpContext.SignOutAsync(
            IdentityConstants.ExternalScheme);

        return NoContent();
    }

    private IActionResult RedirigerVersApplication()
    {
        // Récupère l'adresse du frontend depuis la configuration.
        // En développement : http://localhost:4200
        // En production :
        var urlApplication =
            configuration["ApplicationCliente:Url"];

        // Solution de secours si le paramètre est absent.
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
            // Transforme la collection d'erreurs en une chaîne :
            // "Erreur 1, Erreur 2, Erreur 3"
            string.Join(
                ", ",
                erreurs.Select(erreur => erreur.Description)));
    }
}