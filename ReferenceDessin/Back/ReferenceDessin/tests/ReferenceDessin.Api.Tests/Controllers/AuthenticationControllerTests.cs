using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using ReferenceDessin.Api.Controllers;
using ReferenceDessin.Infrastructure.Identity;

namespace ReferenceDessin.Api.Tests.Controllers;

public sealed class AuthenticationControllerTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("false")]
    [InlineData("not-a-boolean")]
    public async Task GoogleCallback_WhenEmailIsNotVerified_RejectsBeforeAccountLookup(string? verified)
    {
        var (controller, users, signIn) = CreateController(verified);

        var result = await controller.GoogleCallback();

        var error = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status401Unauthorized, error.StatusCode);
        await users.DidNotReceiveWithAnyArgs().FindByEmailAsync(default!);
        await users.DidNotReceiveWithAnyArgs().CreateAsync(default!);
        await users.DidNotReceiveWithAnyArgs().AddLoginAsync(default!, default!);
        await signIn.DidNotReceiveWithAnyArgs().ExternalLoginSignInAsync(default!, default!, default, default);
    }

    [Fact]
    public async Task GoogleCallback_WhenEmailIsVerified_AssociatesExistingAccount()
    {
        var (controller, users, signIn) = CreateController("true");
        var user = new ApplicationUser { Email = "artist@example.com", EmailConfirmed = true };
        users.FindByEmailAsync("artist@example.com").Returns(user);
        users.AddLoginAsync(user, Arg.Any<ExternalLoginInfo>()).Returns(IdentityResult.Success);
        signIn.SignInAsync(user, true, null).Returns(Task.CompletedTask);

        var result = await controller.GoogleCallback();

        Assert.IsType<RedirectResult>(result);
        await users.Received(1).AddLoginAsync(user, Arg.Is<ExternalLoginInfo>(info =>
            info.LoginProvider == GoogleDefaults.AuthenticationScheme && info.ProviderKey == "google-user-123"));
        await users.DidNotReceiveWithAnyArgs().CreateAsync(default!);
        await signIn.Received(1).SignInAsync(user, true, null);
    }

    [Fact]
    public async Task GoogleCallback_WhenEmailIsVerified_CreatesAndLinksNewAccount()
    {
        var (controller, users, signIn) = CreateController("true");
        users.FindByEmailAsync("artist@example.com").Returns((ApplicationUser?)null);
        users.CreateAsync(Arg.Any<ApplicationUser>()).Returns(IdentityResult.Success);
        users.AddLoginAsync(Arg.Any<ApplicationUser>(), Arg.Any<ExternalLoginInfo>())
            .Returns(IdentityResult.Success);
        signIn.SignInAsync(Arg.Any<ApplicationUser>(), true, null).Returns(Task.CompletedTask);

        var result = await controller.GoogleCallback();

        Assert.IsType<RedirectResult>(result);
        await users.Received(1).CreateAsync(Arg.Is<ApplicationUser>(u =>
            u.Email == "artist@example.com" && u.EmailConfirmed));
        await users.Received(1).AddLoginAsync(
            Arg.Is<ApplicationUser>(u => u.Email == "artist@example.com"),
            Arg.Any<ExternalLoginInfo>());
    }

    private static (AuthenticationController Controller, UserManager<ApplicationUser> Users,
        SignInManager<ApplicationUser> SignIn) CreateController(string? verified)
    {
        var users = Substitute.For<UserManager<ApplicationUser>>(
            Substitute.For<IUserStore<ApplicationUser>>(),
            Options.Create(new IdentityOptions()),
            Substitute.For<IPasswordHasher<ApplicationUser>>(),
            Array.Empty<IUserValidator<ApplicationUser>>(),
            Array.Empty<IPasswordValidator<ApplicationUser>>(),
            Substitute.For<ILookupNormalizer>(),
            new IdentityErrorDescriber(),
            Substitute.For<IServiceProvider>(),
            Substitute.For<ILogger<UserManager<ApplicationUser>>>());

        var signIn = Substitute.For<SignInManager<ApplicationUser>>(
            users,
            Substitute.For<IHttpContextAccessor>(),
            Substitute.For<IUserClaimsPrincipalFactory<ApplicationUser>>(),
            Options.Create(new IdentityOptions()),
            Substitute.For<ILogger<SignInManager<ApplicationUser>>>(),
            Substitute.For<IAuthenticationSchemeProvider>(),
            Substitute.For<IUserConfirmation<ApplicationUser>>());

        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, "artist@example.com"),
            new(ClaimTypes.Name, "Artist")
        };
        if (verified is not null)
            claims.Add(new Claim("google:verified_email", verified));

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "Google"));
        signIn.GetExternalLoginInfoAsync(null)
            .Returns(new ExternalLoginInfo(principal, GoogleDefaults.AuthenticationScheme,
                "google-user-123", "Google"));
        signIn.ExternalLoginSignInAsync(GoogleDefaults.AuthenticationScheme, "google-user-123", true, true)
            .Returns(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        var authentication = Substitute.For<IAuthenticationService>();
        authentication.SignOutAsync(Arg.Any<HttpContext>(), IdentityConstants.ExternalScheme, Arg.Any<AuthenticationProperties?>()).Returns(Task.CompletedTask);
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddControllers();
        services.AddSingleton<IAuthenticationService>(authentication);
        var serviceProvider = services.BuildServiceProvider();
        var context = new DefaultHttpContext
        {
            RequestServices = serviceProvider
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ApplicationCliente:Url"] = "/"
        }).Build();
        var controller = new AuthenticationController(
            signIn, users, config, Substitute.For<ILogger<AuthenticationController>>())
        {
            ControllerContext = new ControllerContext { HttpContext = context }
        };
        return (controller, users, signIn);
    }
}
