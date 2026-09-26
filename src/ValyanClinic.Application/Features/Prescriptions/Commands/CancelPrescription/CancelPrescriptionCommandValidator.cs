using FluentValidation;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.CancelPrescription;

public sealed class CancelPrescriptionCommandValidator : AbstractValidator<CancelPrescriptionCommand>
{
    public CancelPrescriptionCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Rețeta este obligatorie.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Motivul anulării este obligatoriu.")
            .MaximumLength(500).WithMessage("Motivul anulării nu poate depăși 500 de caractere.");
    }
}
