using FluentValidation;
using ValyanClinic.Application.Features.Investigations.Validation;

namespace ValyanClinic.Application.Features.Investigations.Commands.CreateInvestigation;

public sealed class CreateInvestigationCommandValidator : AbstractValidator<CreateInvestigationCommand>
{
    public CreateInvestigationCommandValidator()
    {
        RuleFor(x => x.ConsultationId).NotEmpty().WithMessage("ConsultationId este obligatoriu.");
        RuleFor(x => x.PatientId).NotEmpty().WithMessage("PatientId este obligatoriu.");
        RuleFor(x => x.DoctorId).NotEmpty().WithMessage("DoctorId este obligatoriu.");
        RuleFor(x => x.InvestigationType)
            .NotEmpty().WithMessage("Tipul investigației este obligatoriu.")
            .MaximumLength(50);
        RuleFor(x => x.InvestigationDate)
            .NotEmpty().WithMessage("Data investigației este obligatorie.")
            .Must(d => d <= DateTime.UtcNow.AddDays(1))
            .WithMessage("Data investigației nu poate fi în viitor.");
        RuleFor(x => x.Status)
            .Must(s => s is 0 or 1 or 2 or 3)
            .WithMessage("Statusul trebuie să fie 0 (Requested), 1 (Pending), 2 (Completed) sau 3 (Cancelled).");
        RuleFor(x => x.ExternalSource).MaximumLength(200);

        // Validare per tip de investigație (interval, prezență câmpuri obligatorii).
        RuleFor(x => x).Custom((cmd, ctx) =>
        {
            if (string.IsNullOrWhiteSpace(cmd.StructuredData)) return;
            var error = InvestigationStructuredValidator.Validate(cmd.InvestigationType, cmd.StructuredData);
            if (error is not null) ctx.AddFailure(nameof(cmd.StructuredData), error);
        });
    }
}
