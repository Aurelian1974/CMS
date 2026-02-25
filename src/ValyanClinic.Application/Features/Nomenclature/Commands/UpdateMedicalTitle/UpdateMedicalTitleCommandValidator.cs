using FluentValidation;

namespace ValyanClinic.Application.Features.Nomenclature.Commands.UpdateMedicalTitle;

public sealed class UpdateMedicalTitleCommandValidator : AbstractValidator<UpdateMedicalTitleCommand>
{
    public UpdateMedicalTitleCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id-ul titulaturii este obligatoriu.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Numele titulaturii este obligatoriu.")
            .MaximumLength(100).WithMessage("Numele nu poate depăși 100 de caractere.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Codul titulaturii este obligatoriu.")
            .MaximumLength(20).WithMessage("Codul nu poate depăși 20 de caractere.")
            .Matches(@"^[A-Z0-9_]+$").WithMessage("Codul trebuie să conțină doar litere mari, cifre și underscore.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Descrierea nu poate depăși 500 de caractere.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Ordinea de afișare trebuie să fie >= 0.");
    }
}
