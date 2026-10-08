using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ReferenceDessin.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/securite")]
public sealed class SecurityController(
    IAntiforgery antiforgery, 
    IWebHostEnvironment environnement) 
    : ControllerBase
{
    [HttpGet("jeton-antifalsification")]
    public IActionResult ObtenirJetonAntifalsification()
    {
        var jetons = antiforgery.GetAndStoreTokens(HttpContext);

        if (string.IsNullOrWhiteSpace(jetons.RequestToken))
        {
            return Problem(
                title: "Impossible de générer un jeton de sécurité.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
        
        Response.Cookies.Append(
            "XSRF-TOKEN",
            jetons.RequestToken,
            new CookieOptions
            {
                HttpOnly = false,
                Secure = !environnement.IsDevelopment(),
                SameSite = SameSiteMode.Strict,
                Path = "/"
            });

        return NoContent();
    }
}