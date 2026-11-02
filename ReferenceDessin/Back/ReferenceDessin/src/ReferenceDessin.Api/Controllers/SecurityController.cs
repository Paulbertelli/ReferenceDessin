using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ReferenceDessin.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/securite")]
public sealed class SecurityController(
    IAntiforgery antiforgery, 
    IWebHostEnvironment environment) 
    : ControllerBase
{
    [HttpGet("jeton-antifalsification")]
    public IActionResult GetAntiforgeryToken()
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);

        if (string.IsNullOrWhiteSpace(tokens.RequestToken))
        {
            return Problem(
                title: "Impossible de générer un jeton de sécurité.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
        
        Response.Cookies.Append(
            "XSRF-TOKEN",
            tokens.RequestToken,
            new CookieOptions
            {
                HttpOnly = false,
                Secure = !environment.IsDevelopment(),
                SameSite = SameSiteMode.Strict,
                Path = "/"
            });

        return NoContent();
    }
}