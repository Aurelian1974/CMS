using FluentValidation;

namespace ValyanClinic.Application.Features.Tariffs.Commands.CreateMedicalService;

public sealed class CreateMedicalServiceCommandValidator : AbstractValidator<CreateMedicalServiceCommand>
{
    public CreateMedicalServiceCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Codul serviciului este obligatoriu.")
            .MaximumLength(30).WithMessage("Codul nu poate depăși 30 de caractere.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Denumirea serviciului este obligatorie.")
            .MaximumLength(200).WithMessage("Denumirea nu poate depăși 200 de caractere.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Categoria este obligatorie.");

        RuleFor(x => x.DurationMinutes)
            .InclusiveBetween(1, 1440).WithMessage("Durata trebuie să fie între 1 și 1440 de minute.")
            .When(x => x.DurationMinutes.HasValue);

        RuleFor(x => x.InvestigationTypeCode)
            .MaximumLength(50).When(x => !string.IsNullOrEmpty(x.InvestigationTypeCode));

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Prețul nu poate fi negativ.")
            .LessThan(10_000_000).WithMessage("Prețul depășește valoarea maximă permisă.")
            .PrecisionScale(18, 2, true).WithMessage("Prețul poate avea cel mult 2 zecimale.");

        RuleFor(x => x.VatRateId)
            .NotEmpty().WithMessage("Regimul TVA este obligatoriu.");
    }
}
