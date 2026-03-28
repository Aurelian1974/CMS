using FluentValidation;

namespace ValyanClinic.Application.Features.Appointments.Commands.UpdateAppointmentStatus;

public sealed class UpdateAppointmentStatusCommandValidator
    : AbstractValidator<UpdateAppointmentStatusCommand>
{
    public UpdateAppointmentStatusCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id-ul programării este obligatoriu.");

        RuleFor(x => x.StatusId)
            .NotEmpty().WithMessage("Id-ul statusului este obligatoriu.");
    }
}
