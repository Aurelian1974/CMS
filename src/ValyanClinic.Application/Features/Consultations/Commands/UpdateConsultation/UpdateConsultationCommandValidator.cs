using FluentValidation;

namespace ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultation;

public sealed class UpdateConsultationCommandValidator : AbstractValidator<UpdateConsultationCommand>
{
    public UpdateConsultationCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id-ul consultației este obligatoriu.");

        RuleFor(x => x.PatientId)
            .NotEmpty().WithMessage("Pacientul este obligatoriu.");

        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("Doctorul este obligatoriu.");

        RuleFor(x => x.Date)
            .NotEmpty().WithMessage("Data consultației este obligatorie.")
            .GreaterThan(DateTime.MinValue).WithMessage("Data consultației nu este validă.");

        RuleFor(x => x.Motiv)
            .MaximumLength(4000).WithMessage("Motivul nu poate depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Motiv));

        RuleFor(x => x.ExamenClinic)
            .MaximumLength(4000).WithMessage("Examenul clinic nu poate depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.ExamenClinic));

        RuleFor(x => x.Diagnostic)
            .MaximumLength(4000).WithMessage("Diagnosticul nu poate depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Diagnostic));

        RuleFor(x => x.DiagnosticCodes)
            .MaximumLength(2000).WithMessage("Codurile de diagnostic nu pot depăși 2000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.DiagnosticCodes));

        RuleFor(x => x.Recomandari)
            .MaximumLength(4000).WithMessage("Recomandările nu pot depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Recomandari));

        RuleFor(x => x.Observatii)
            .MaximumLength(4000).WithMessage("Observațiile nu pot depăși 4000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Observatii));
    }
}
