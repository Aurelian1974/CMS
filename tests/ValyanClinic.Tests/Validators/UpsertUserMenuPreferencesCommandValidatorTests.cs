using FluentValidation.TestHelper;
using ValyanClinic.Application.Features.UserMenuPreferences.Commands.UpsertUserMenuPreferences;
using Xunit;

namespace ValyanClinic.Tests.Validators;

public sealed class UpsertUserMenuPreferencesCommandValidatorTests
{
    private readonly UpsertUserMenuPreferencesCommandValidator _validator = new();

    [Fact]
    public void ValidRoutes_ShouldPassValidation()
    {
        var command = new UpsertUserMenuPreferencesCommand(["/patients", "/consultations"]);
        _validator.TestValidate(command).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void EmptyList_ShouldPassValidation()
    {
        var command = new UpsertUserMenuPreferencesCommand([]);
        _validator.TestValidate(command).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void TooManyRoutes_ShouldHaveError()
    {
        var routes = Enumerable.Range(0, 51).Select(i => $"/route-{i}").ToList();
        var command = new UpsertUserMenuPreferencesCommand(routes);

        _validator.TestValidate(command).ShouldHaveValidationErrorFor(x => x.FavoriteRoutes);
    }

    [Fact]
    public void RouteNotStartingWithSlash_ShouldHaveError()
    {
        var command = new UpsertUserMenuPreferencesCommand(["patients"]);

        _validator.TestValidate(command)
                  .ShouldHaveValidationErrorFor("FavoriteRoutes[0]")
                  .WithErrorMessage("O rută favorită trebuie să înceapă cu '/'.");
    }

    [Fact]
    public void EmptyRoute_ShouldHaveError()
    {
        var command = new UpsertUserMenuPreferencesCommand([""]);

        _validator.TestValidate(command).ShouldHaveValidationErrorFor("FavoriteRoutes[0]");
    }

    [Fact]
    public void RouteTooLong_ShouldHaveError()
    {
        var command = new UpsertUserMenuPreferencesCommand(["/" + new string('x', 200)]);

        _validator.TestValidate(command)
                  .ShouldHaveValidationErrorFor("FavoriteRoutes[0]")
                  .WithErrorMessage("O rută favorită nu poate depăși 200 de caractere.");
    }
}
