using FluentValidation;

namespace ValyanClinic.Application.Features.UserMenuPreferences.Commands.UpsertUserMenuPreferences;

public sealed class UpsertUserMenuPreferencesCommandValidator : AbstractValidator<UpsertUserMenuPreferencesCommand>
{
    private const int MaxFavorites = 50;

    public UpsertUserMenuPreferencesCommandValidator()
    {
        RuleFor(x => x.FavoriteRoutes)
            .NotNull().WithMessage("Lista de favorite este obligatorie.")
            .Must(routes => routes.Count <= MaxFavorites)
            .WithMessage($"Nu pot exista mai mult de {MaxFavorites} favorite.");

        RuleForEach(x => x.FavoriteRoutes)
            .NotEmpty().WithMessage("O rută favorită nu poate fi goală.")
            .MaximumLength(200).WithMessage("O rută favorită nu poate depăși 200 de caractere.")
            .Must(route => route.StartsWith('/')).WithMessage("O rută favorită trebuie să înceapă cu '/'.");
    }
}
