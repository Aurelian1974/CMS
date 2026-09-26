using FluentValidation;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.ConsultationMedications;

namespace ValyanClinic.Application.Features.Prescriptions.Commands;

/// <summary>Reguli comune pentru un medicament de pe rețetă (creare + actualizare).</summary>
public sealed class PrescriptionItemDataValidator : AbstractValidator<PrescriptionItemData>
{
    public const int MaxQuantity = 9999;

    public PrescriptionItemDataValidator()
    {
        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.DrugCode) || !string.IsNullOrWhiteSpace(x.DrugName))
            .WithMessage("Fiecare medicament trebuie selectat din nomenclator sau să aibă o denumire.");

        RuleFor(x => x.DrugCode)
            .MaximumLength(50).WithMessage("Codul medicamentului nu poate depăși 50 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.DrugCode));

        RuleFor(x => x.DrugName)
            .MaximumLength(500).WithMessage("Denumirea medicamentului nu poate depăși 500 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.DrugName));

        RuleFor(x => x.CopaymentListType)
            .MaximumLength(20).WithMessage("Lista de compensare nu poate depăși 20 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.CopaymentListType));

        RuleFor(x => x.DrugCode)
            .NotEmpty().WithMessage("Medicamentele compensate trebuie selectate din nomenclatorul CNAS.")
            .When(x => !string.IsNullOrEmpty(x.CopaymentListType));

        RuleFor(x => x.DiagnosisCode)
            .MaximumLength(20).WithMessage("Codul de diagnostic nu poate depăși 20 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.DiagnosisCode));

        RuleFor(x => x.DoseMorning).ValidDose("dimineață");
        RuleFor(x => x.DoseAfternoon).ValidDose("după-amiază");
        RuleFor(x => x.DoseEvening).ValidDose("seară");

        RuleFor(x => x.DurationDays)
            .InclusiveBetween(1, 365).WithMessage("Durata trebuie să fie între 1 și 365 de zile.")
            .When(x => x.DurationDays.HasValue);

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Cantitatea trebuie să fie pozitivă.")
            .LessThanOrEqualTo(MaxQuantity).WithMessage($"Cantitatea nu poate depăși {MaxQuantity}.")
            .When(x => x.Quantity.HasValue);

        RuleFor(x => x.Instructions)
            .MaximumLength(1000).WithMessage("Indicațiile nu pot depăși 1000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Instructions));
    }
}
