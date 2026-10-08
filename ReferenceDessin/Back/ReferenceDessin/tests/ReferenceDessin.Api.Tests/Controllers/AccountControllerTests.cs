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

public sealed class AccountControllerTests
{
    [Fact]
    public async Task Delete_WhenUserIsAuthenticated_DeletesUserAndSignsOut()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "paul@example.com",
            Email = "paul@example.com",
            DisplayName = "Paul"
        };

        var userManager =
            CreateUserManager();

        userManager
            .GetUserAsync(Arg.Any<ClaimsPrincipal>())
            .Returns(user);

        userManager
            .DeleteAsync(user)
            .Returns(IdentityResult.Success);

        var signInManager =
            CreateSignInManager(
                userManager);

        signInManager
            .SignOutAsync()
            .Returns(Task.CompletedTask);

        var controller = new AccountController(
            userManager,
            signInManager,
            Substitute.For<ILogger<AccountController>>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        // Act
        var result = await controller.Delete();

        // Assert
        Assert.IsType<NoContentResult>(result);

        await userManager
            .Received(1)
            .DeleteAsync(user);

        await signInManager
            .Received(1)
            .SignOutAsync();
    }

    private static AccountController CreateController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        return new AccountController(
            userManager,
            signInManager,
            Substitute.For<ILogger<AccountController>>())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };
    }

    private static UserManager<ApplicationUser>
        CreateUserManager()
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
        CreateSignInManager(
            UserManager<ApplicationUser> userManager)
    {
        return Substitute.For<SignInManager<ApplicationUser>>(
            userManager,
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
    public async Task Delete_WhenUserIsNotFound_ReturnsNotFound()
    {
        // Arrange
        var userManager =
            CreateUserManager();

        userManager
            .GetUserAsync(
                Arg.Any<
                    ClaimsPrincipal>())
            .Returns((ApplicationUser?)null);

        var signInManager =
            CreateSignInManager(
                userManager);

        var controller = CreateController(
            userManager,
            signInManager);

        // Act
        var result = await controller.Delete();

        // Assert
        Assert.IsType<NotFoundResult>(result);

        await userManager
            .DidNotReceiveWithAnyArgs()
            .DeleteAsync(default!);

        await signInManager
            .DidNotReceive()
            .SignOutAsync();
    }

    [Fact]
    public async Task Delete_WhenIdentityFails_ReturnsProblemWithoutSigningOut()
    {
        // Arrange
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "paul@example.com",
            Email = "paul@example.com",
            DisplayName = "Paul"
        };

        var userManager =
            CreateUserManager();

        userManager
            .GetUserAsync(
                Arg.Any<
                    ClaimsPrincipal>())
            .Returns(user);

        userManager
            .DeleteAsync(user)
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

        var signInManager =
            CreateSignInManager(
                userManager);

        var controller = CreateController(
            userManager,
            signInManager);

        // Act
        var result = await controller.Delete();

        // Assert
        var errorResult =
            Assert.IsType<ObjectResult>(result);

        Assert.Equal(
            StatusCodes.Status500InternalServerError,
            errorResult.StatusCode);

        var problem =
            Assert.IsType<ProblemDetails>(
                errorResult.Value);

        Assert.Equal(
            "Impossible de supprimer le compte.",
            problem.Title);

        await signInManager
            .DidNotReceive()
            .SignOutAsync();
    }
}