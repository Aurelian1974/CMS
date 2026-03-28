using FluentValidation;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointmentsForScheduler;

public sealed class GetAppointmentsForSchedulerQueryValidator
    : AbstractValidator<GetAppointmentsForSchedulerQuery>
{
    public GetAppointmentsForSchedulerQueryValidator()
    {
        RuleFor(x => x.DateFrom)
            .NotEmpty().WithMessage("Data de început este obligatorie.");

        RuleFor(x => x.DateTo)
            .NotEmpty().WithMessage("Data de sfârșit este obligatorie.")
            .GreaterThan(x => x.DateFrom)
            .WithMessage("Data de sfârșit trebuie să fie după data de început.");

        RuleFor(x => x)
            .Must(x => (x.DateTo - x.DateFrom).TotalDays <= 93)
            .WithMessage("Intervalul scheduler nu poate depăși 3 luni (93 de zile).")
            .When(x => x.DateTo > x.DateFrom);
    }
}
