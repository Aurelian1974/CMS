using FluentValidation;

namespace ValyanClinic.Application.Features.Appointments.Commands.CreateAppointment;

public sealed class CreateAppointmentCommandValidator : AbstractValidator<CreateAppointmentCommand>
{
    public CreateAppointmentCommandValidator()
    {
        RuleFor(x => x.PatientId)
            .NotEmpty().WithMessage("Pacientul este obligatoriu.");

        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("Doctorul este obligatoriu.");

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("Data și ora de început sunt obligatorii.")
            .GreaterThan(DateTime.MinValue).WithMessage("Data de început nu este validă.");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("Data și ora de sfârșit sunt obligatorii.")
            .GreaterThan(x => x.StartTime).WithMessage("Ora de sfârșit trebuie să fie după ora de început.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Observațiile nu pot depăși 2000 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Notes));
    }
}
