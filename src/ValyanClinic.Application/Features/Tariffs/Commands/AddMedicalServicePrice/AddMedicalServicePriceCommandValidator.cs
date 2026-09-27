using FluentValidation;

namespace ValyanClinic.Application.Features.Tariffs.Commands.AddMedicalServicePrice;

public sealed class AddMedicalServicePriceCommandValidator : AbstractValidator<AddMedicalServicePriceCommand>
{
    public AddMedicalServicePriceCommandValidator()
    {
        RuleFor(x => x.MedicalServiceId).NotEmpty();

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("Prețul nu poate fi negativ.")
            .LessThan(10_000_000).WithMessage("Prețul depășește valoarea maximă permisă.")
            .PrecisionScale(18, 2, true).WithMessage("Prețul poate avea cel mult 2 zecimale.");

        RuleFor(x => x.VatRateId)
            .NotEmpty().WithMessage("Regimul TVA este obligatoriu.");

        RuleFor(x => x.ValidFrom)
            .NotEqual(default(DateOnly)).WithMessage("Data de la care se aplică prețul este obligatorie.");
    }
}
