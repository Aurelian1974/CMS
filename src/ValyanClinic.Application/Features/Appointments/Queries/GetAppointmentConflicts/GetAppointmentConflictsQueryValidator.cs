using FluentValidation;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentConflicts;

public sealed class GetAppointmentConflictsQueryValidator : AbstractValidator<GetAppointmentConflictsQuery>
{
    public GetAppointmentConflictsQueryValidator()
    {
        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("Doctorul este obligatoriu.");

        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime).WithMessage("Ora de sfârșit trebuie să fie după ora de început.");
    }
}
