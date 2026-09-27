using FluentValidation;

namespace ValyanClinic.Application.Features.Tariffs.Commands.UpdateVatRate;

public sealed class UpdateVatRateCommandValidator : AbstractValidator<UpdateVatRateCommand>
{
    public UpdateVatRateCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Denumirea regimului TVA este obligatorie.")
            .MaximumLength(150).WithMessage("Denumirea nu poate depăși 150 de caractere.");

        RuleFor(x => x.Percent)
            .InclusiveBetween(0, 99.99m).WithMessage("Cota TVA trebuie să fie între 0 și 99,99%.");

        RuleFor(x => x.UblCategoryCode)
            .NotEmpty().WithMessage("Categoria TVA (e-Factura) este obligatorie.")
            .MaximumLength(3);

        RuleFor(x => x.Percent)
            .Equal(0).WithMessage("Regimurile scutite / în afara sferei au cota 0%.")
            .When(x => x.UblCategoryCode is "E" or "O" or "Z");

        RuleFor(x => x.ExemptionReasonCode).MaximumLength(30);
        RuleFor(x => x.ExemptionReasonText).MaximumLength(300);
    }
}
