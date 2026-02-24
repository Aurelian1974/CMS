using FluentValidation;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.CreateSpecialty;

public sealed class CreateSpecialtyCommandValidator : AbstractValidator<CreateSpecialtyCommand>
{
    public CreateSpecialtyCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Numele specializării este obligatoriu.")
            .MaximumLength(150).WithMessage("Numele nu poate depăși 150 de caractere.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Codul specializării este obligatoriu.")
            .MaximumLength(20).WithMessage("Codul nu poate depăși 20 de caractere.")
            .Matches(@"^[A-Z0-9_]+$").WithMessage("Codul trebuie să conțină doar litere mari, cifre și underscore.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Descrierea nu poate depăși 500 de caractere.");

        RuleFor(x => x.Level)
            .InclusiveBetween((byte)0, (byte)2)
            .WithMessage("Nivelul trebuie să fie 0 (categorie), 1 (specialitate) sau 2 (subspecialitate).");

        RuleFor(x => x.ParentId)
            .NotNull().When(x => x.Level > 0)
            .WithMessage("Specializările de nivel 1 și 2 trebuie să aibă un părinte.");

        RuleFor(x => x.ParentId)
            .Null().When(x => x.Level == 0)
            .WithMessage("Categoriile (nivel 0) nu pot avea părinte.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Ordinea de afișare trebuie să fie >= 0.");
    }
}
