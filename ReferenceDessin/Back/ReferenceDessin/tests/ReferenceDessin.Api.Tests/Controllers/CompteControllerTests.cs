using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using ReferenceDessin.Api.Controllers;
using ReferenceDessin.Infrastructure.Identity;

namespace ReferenceDessin.Api.Tests.Controllers;

public sealed class CompteControllerTests
{
    [Fact]
    public async Task Supprimer_UtilisateurConnecte_SupprimeEtDeconnecte()
    {
        // Arrange
        var utilisateur = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "paul@example.com",
            Email = "paul@example.com",
            NomAffiche = "Paul"
        };

        var gestionnaireUtilisateurs =
            CreerGestionnaireUtilisateurs();

        gestionnaireUtilisateurs
            .GetUserAsync(Arg.Any<ClaimsPrincipal>())
            .Returns(utilisateur);

        gestionnaireUtilisateurs
            .DeleteAsync(utilisateur)
            .Returns(IdentityResult.Success);

        var gestionnaireConnexion =
            CreerGestionnaireConnexion(
                gestionnaireUtilisateurs);

        gestionnaireConnexion
            .SignOutAsync()
            .Returns(Task.CompletedTask);

        var controleur = new CompteController(
            gestionnaireUtilisateurs,
            gestionnaireConnexion,
            Substitute.For<ILogger<CompteController>>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        // Act
        var resultat = await controleur.Supprimer();

        // Assert
        Assert.IsType<NoContentResult>(resultat);

        await gestionnaireUtilisateurs
            .Received(1)
            .DeleteAsync(utilisateur);

        await gestionnaireConnexion
            .Received(1)
            .SignOutAsync();
    }

    private static CompteController CreerControleur(
        UserManager<ApplicationUser> gestionnaireUtilisateurs,
        SignInManager<ApplicationUser> gestionnaireConnexion)
    {
        return new CompteController(
            gestionnaireUtilisateurs,
            gestionnaireConnexion,
            Substitute.For<ILogger<CompteController>>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };
    }

    private static UserManager<ApplicationUser>
        CreerGestionnaireUtilisateurs()
    {
        return Substitute.For<UserManager<ApplicationUser>>(
            Substitute.For<IUserStore<ApplicationUser>>(),
            Options.Create(new IdentityOptions()),
            Substitute.For<IPasswordHasher<ApplicationUser>>(),
            Array.Empty<IUserValidator<ApplicationUser>>(),
            Array.Empty<IPasswordValidator<ApplicationUser>>(),
            Substitute.For<ILookupNormalizer>(),
            new IdentityErrorDescriber(),
            Substitute.For<IServiceProvider>(),
            Substitute.For<
                ILogger<UserManager<ApplicationUser>>>()
        );
    }

    private static SignInManager<ApplicationUser>
        CreerGestionnaireConnexion(
            UserManager<ApplicationUser> gestionnaireUtilisateurs)
    {
        return Substitute.For<SignInManager<ApplicationUser>>(
            gestionnaireUtilisateurs,
            Substitute.For<IHttpContextAccessor>(),
            Substitute.For<
                IUserClaimsPrincipalFactory<ApplicationUser>>(),
            Options.Create(new IdentityOptions()),
            Substitute.For<
                ILogger<SignInManager<ApplicationUser>>>(),
            Substitute.For<IAuthenticationSchemeProvider>(),
            Substitute.For<IUserConfirmation<ApplicationUser>>()
        );
    }

    [Fact]
    public async Task Supprimer_UtilisateurIntrouvable_Retourne404()
    {
        // Arrange
        var gestionnaireUtilisateurs =
            CreerGestionnaireUtilisateurs();

        gestionnaireUtilisateurs
            .GetUserAsync(
                Arg.Any<
                    ClaimsPrincipal>())
            .Returns((ApplicationUser?)null);

        var gestionnaireConnexion =
            CreerGestionnaireConnexion(
                gestionnaireUtilisateurs);

        var controleur = CreerControleur(
            gestionnaireUtilisateurs,
            gestionnaireConnexion);

        // Act
        var resultat = await controleur.Supprimer();

        // Assert
        Assert.IsType<NotFoundResult>(resultat);

        await gestionnaireUtilisateurs
            .DidNotReceiveWithAnyArgs()
            .DeleteAsync(default!);

        await gestionnaireConnexion
            .DidNotReceive()
            .SignOutAsync();
    }

    [Fact]
    public async Task Supprimer_EchecIdentity_Retourne500SansDeconnecter()
    {
        // Arrange
        var utilisateur = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "paul@example.com",
            Email = "paul@example.com",
            NomAffiche = "Paul"
        };

        var gestionnaireUtilisateurs =
            CreerGestionnaireUtilisateurs();

        gestionnaireUtilisateurs
            .GetUserAsync(
                Arg.Any<
                    ClaimsPrincipal>())
            .Returns(utilisateur);

        gestionnaireUtilisateurs
            .DeleteAsync(utilisateur)
            .Returns(
                IdentityResult.Failed(
                    new IdentityError
                    {
                        Code = "SuppressionImpossible",
                        Description =
                            "La suppression a échoué."
                    }
                )
            );

        var gestionnaireConnexion =
            CreerGestionnaireConnexion(
                gestionnaireUtilisateurs);

        var controleur = CreerControleur(
            gestionnaireUtilisateurs,
            gestionnaireConnexion);

        // Act
        var resultat = await controleur.Supprimer();

        // Assert
        var resultatErreur =
            Assert.IsType<ObjectResult>(resultat);

        Assert.Equal(
            StatusCodes.Status500InternalServerError,
            resultatErreur.StatusCode);

        var probleme =
            Assert.IsType<ProblemDetails>(
                resultatErreur.Value);

        Assert.Equal(
            "Impossible de supprimer le compte.",
            probleme.Title);

        await gestionnaireConnexion
            .DidNotReceive()
            .SignOutAsync();
    }
}