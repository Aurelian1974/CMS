using FluentValidation;

namespace ValyanClinic.Application.Features.ConsultationMedications.Commands.UpdateConsultationMedication;

public sealed class UpdateConsultationMedicationCommandValidator : AbstractValidator<UpdateConsultationMedicationCommand>
{
    public UpdateConsultationMedicationCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Rândul din tratament este obligatoriu.");

        RuleFor(x => x.CopaymentListType)
            .MaximumLength(20).WithMessage("Lista de compensare nu poate depăși 20 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.CopaymentListType));

        RuleFor(x => x.DoseMorning).ValidDose("dimineață");
        RuleFor(x => x.DoseAfternoon).ValidDose("după-amiază");
        RuleFor(x => x.DoseEvening).ValidDose("seară");

        RuleFor(x => x.DurationDays)
            .InclusiveBetween(1, 365).WithMessage("Durata trebuie să fie între 1 și 365 de zile.")
            .When(x => x.DurationDays.HasValue);

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Observațiile nu pot depăși 1000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}
