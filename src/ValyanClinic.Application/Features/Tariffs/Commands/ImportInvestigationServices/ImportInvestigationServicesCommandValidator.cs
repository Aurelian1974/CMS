using FluentValidation;

namespace ValyanClinic.Application.Features.Tariffs.Commands.ImportInvestigationServices;

public sealed class ImportInvestigationServicesCommandValidator : AbstractValidator<ImportInvestigationServicesCommand>
{
    private const int MaxItems = 200;

    public ImportInvestigationServicesCommandValidator()
    {
        RuleFor(x => x.Items)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Selectați cel puțin o investigație.")
            .Must(items => items.Count <= MaxItems).WithMessage($"Se pot importa cel mult {MaxItems} de investigații odată.")
            .Must(items => items
                    .Select(i => i.InvestigationTypeCode?.Trim())
                    .Distinct(StringComparer.Ordinal)
                    .Count() == items.Count)
                .WithMessage("O investigație apare de mai multe ori în listă.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.InvestigationTypeCode)
                .NotEmpty().WithMessage("Tipul investigației este obligatoriu.")
                .MaximumLength(50).WithMessage("Codul tipului de investigație nu poate depăși 50 de caractere.");

            item.RuleFor(i => i.Name)
                .NotEmpty().WithMessage("Denumirea serviciului este obligatorie.")
                .MaximumLength(200).WithMessage("Denumirea nu poate depăși 200 de caractere.");

            item.RuleFor(i => i.Price!.Value)
                .GreaterThanOrEqualTo(0).WithMessage("Prețul nu poate fi negativ.")
                .LessThan(10_000_000).WithMessage("Prețul depășește valoarea maximă permisă.")
                .PrecisionScale(18, 2, true).WithMessage("Prețul poate avea cel mult 2 zecimale.")
                .OverridePropertyName("Price")
                .When(i => i.Price.HasValue);
        });

        RuleFor(x => x.VatRateId)
            .NotEmpty().WithMessage("Regimul TVA este obligatoriu când se completează prețuri.")
            .When(x => x.Items?.Any(i => i.Price.HasValue) == true);
    }
}
