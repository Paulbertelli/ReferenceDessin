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
    SignInManager<ApplicationUser> signInManager,
    UserManager<ApplicationUser> userManager,
    IConfiguration configuration,
    ILogger<AuthenticationController> logger)
    : ControllerBase
{
    private const string ProfileImageClaimType = "picture";
    
   [AllowAnonymous]
    [HttpGet("google")]
    public IActionResult GoogleLogin()
    {
        var callbackUrl = Url.Action(
            nameof(GoogleCallback),
            "Authentication");
        
        if (callbackUrl is null)
        {
            return Problem(
                title: "Impossible de préparer la connexion Google.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        var authenticationProperties = 
            signInManager.ConfigureExternalAuthenticationProperties(
                GoogleDefaults.AuthenticationScheme, 
                callbackUrl);

        return Challenge(
            authenticationProperties,
            GoogleDefaults.AuthenticationScheme);
    }

    [AllowAnonymous]
    [HttpGet("google/retour")]
    public async Task<IActionResult> GoogleCallback()
    {
        var externalLoginInfo =
            await signInManager
                .GetExternalLoginInfoAsync();
        
        if (externalLoginInfo is null)
        {
            return Problem(
                title: "La réponse de Google est invalide.",
                statusCode: StatusCodes.Status401Unauthorized);
        }
        
        var profileImageUrl = GetProfileImageUrl(
            externalLoginInfo.Principal);

        var signInResult =
            await signInManager
                .ExternalLoginSignInAsync(
                    externalLoginInfo.LoginProvider,
                    externalLoginInfo.ProviderKey,
                    isPersistent: true,
                    bypassTwoFactor: true);

        if (signInResult.Succeeded)
        {
            var existingUser =
                await userManager.FindByLoginAsync(
                    externalLoginInfo.LoginProvider,
                    externalLoginInfo.ProviderKey);

            if (existingUser is not null)
            {
                await UpdateProfileImageAsync(
                    existingUser,
                    profileImageUrl);
            }
            
            await HttpContext.SignOutAsync(
                IdentityConstants.ExternalScheme);
            
            return RedirectToApplication();
        }

        var email =
            externalLoginInfo.Principal
                .FindFirstValue(ClaimTypes.Email);

        if (string.IsNullOrWhiteSpace(email))
        {
            return Problem(
                title: "Google n’a pas fourni d’adresse e-mail.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var user =
            await userManager
                .FindByEmailAsync(email);

        var userCreated = false;

        if (user is null)
        {
            var displayName =
                externalLoginInfo.Principal
                    .FindFirstValue(ClaimTypes.Name);

            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                DisplayName = string.IsNullOrWhiteSpace(displayName)
                    ? email
                    : displayName,
                ProfileImageUrl = profileImageUrl,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };

            var creationResult =
                await userManager
                    .CreateAsync(user);
            
            if (!creationResult.Succeeded)
            {
                LogErrors(
                    "création de l’utilisateur",
                    creationResult.Errors);

                return Problem(
                    title: "Impossible de créer le compte.",
                    statusCode:
                        StatusCodes.Status500InternalServerError);
            }

            userCreated = true;
        }
        else
        {
            await UpdateProfileImageAsync(
                user,
                profileImageUrl);
        }
        

        var loginAssociationResult =
            await userManager.AddLoginAsync(
                user,
                externalLoginInfo);

        if (!loginAssociationResult.Succeeded)
        {
            LogErrors(
                "association du compte Google",
                loginAssociationResult.Errors);
            
            if (userCreated)
            {
                await userManager
                    .DeleteAsync(user);
            }

            return Problem(
                title: "Impossible d’associer le compte Google.",
                statusCode:
                    StatusCodes.Status500InternalServerError);
        }
        
        await signInManager.SignInAsync(
            user,
            isPersistent: true);
        
        await HttpContext.SignOutAsync(
            IdentityConstants.ExternalScheme);
        
        return RedirectToApplication();
    }

    [Authorize]
    [HttpPost("deconnexion")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();

        await HttpContext.SignOutAsync(
            IdentityConstants.ExternalScheme);

        return NoContent();
    }

    private static string? GetProfileImageUrl(
        ClaimsPrincipal principal)
    {
        var value =
            principal.FindFirstValue(
                ProfileImageClaimType);

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalizedValue = value.Trim();

        if (normalizedValue.Length > 2048)
        {
            return null;
        }

        if (!Uri.TryCreate(
                normalizedValue,
                UriKind.Absolute,
                out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps)
        {
            return null;
        }

        return uri.AbsoluteUri;
    }

    private async Task UpdateProfileImageAsync(
        ApplicationUser user,
        string? profileImageUrl)
    {
        if (profileImageUrl is null ||
            string.Equals(
                user.ProfileImageUrl,
                profileImageUrl,
                StringComparison.Ordinal))
        {
            return;
        }

        user.ProfileImageUrl = profileImageUrl;

        var updateResult =
            await userManager.UpdateAsync(user);

        if (!updateResult.Succeeded)
        {
            LogErrors(
                "mise à jour de la photo de profil",
                updateResult.Errors);
        }
    }
    
    private IActionResult RedirectToApplication()
    {
        var applicationUrl =
            configuration["ApplicationCliente:Url"];

        if (string.IsNullOrWhiteSpace(applicationUrl))
        {
            applicationUrl = "/";
        }

        return Redirect(applicationUrl);
    }

    private void LogErrors(
        string operation,
        IEnumerable<IdentityError> errors)
    {
        logger.LogError(
            "Échec pendant {Operation} : {Erreurs}",
            operation,
            string.Join(
                ", ",
                errors.Select(error => error.Description)));
    }
}