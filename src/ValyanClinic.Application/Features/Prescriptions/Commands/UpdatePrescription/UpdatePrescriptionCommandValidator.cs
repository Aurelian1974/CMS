using FluentValidation;
using ValyanClinic.Application.Features.Prescriptions.Commands.CreatePrescriptions;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.UpdatePrescription;

public sealed class UpdatePrescriptionCommandValidator : AbstractValidator<UpdatePrescriptionCommand>
{
    public UpdatePrescriptionCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Rețeta este obligatorie.");

        RuleFor(x => x.TreatmentDays)
            .InclusiveBetween(1, 365).WithMessage("Durata tratamentului trebuie să fie între 1 și 365 de zile.")
            .When(x => x.TreatmentDays.HasValue);

        RuleFor(x => x.Diagnostic)
            .MaximumLength(1000).WithMessage("Diagnosticul nu poate depăși 1000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Diagnostic));

        RuleFor(x => x.DiagnosticCodes)
            .MaximumLength(500).WithMessage("Codurile de diagnostic nu pot depăși 500 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.DiagnosticCodes));

        RuleFor(x => x.RegistryNumber)
            .MaximumLength(50).WithMessage("Numărul din registru nu poate depăși 50 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.RegistryNumber));

        RuleFor(x => x.ReferralLetterNumber)
            .MaximumLength(50).WithMessage("Numărul scrisorii medicale nu poate depăși 50 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.ReferralLetterNumber));

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Observațiile nu pot depăși 1000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Notes));

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Rețeta trebuie să conțină cel puțin un medicament.")
            .Must(items => items is null || items.Count <= CreatePrescriptionsCommandValidator.MaxItemsPerRequest)
            .WithMessage($"Se pot prescrie maximum {CreatePrescriptionsCommandValidator.MaxItemsPerRequest} medicamente odată.");

        RuleForEach(x => x.Items).SetValidator(new PrescriptionItemDataValidator());
    }
}
