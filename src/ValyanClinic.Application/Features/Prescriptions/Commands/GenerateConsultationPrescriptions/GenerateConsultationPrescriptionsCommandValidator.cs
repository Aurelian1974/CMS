using FluentValidation;

namespace ValyanClinic.Application.Features.Prescriptions.Commands.GenerateConsultationPrescriptions;

public sealed class GenerateConsultationPrescriptionsCommandValidator
    : AbstractValidator<GenerateConsultationPrescriptionsCommand>
{
    public GenerateConsultationPrescriptionsCommandValidator()
    {
        RuleFor(x => x.ConsultationId)
            .NotEmpty().WithMessage("Consultația este obligatorie.");

        RuleFor(x => x.TreatmentDays)
            .InclusiveBetween(1, 365).WithMessage("Durata tratamentului trebuie să fie între 1 și 365 de zile.")
            .When(x => x.TreatmentDays.HasValue);
    }
}
