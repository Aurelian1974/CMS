using FluentValidation;

namespace ValyanClinic.Application.Features.Appointments.Commands;

/// <summary>Reguli de durată comune Create/Update: 5 min – 8 h, aceeași zi calendaristică.</summary>
public sealed class AppointmentDurationRules<T> : AbstractValidator<T>
{
    private const int MinDurationMinutes = 5;
    private const int MaxDurationHours   = 8;
    private const string EndTimeProperty = "EndTime";

    public AppointmentDurationRules(Func<T, DateTime> start, Func<T, DateTime> end)
    {
        RuleFor(x => x)
            .Must(x => (end(x) - start(x)).TotalMinutes >= MinDurationMinutes)
            .OverridePropertyName(EndTimeProperty)
            .WithMessage($"Programarea trebuie să dureze cel puțin {MinDurationMinutes} minute.")
            .When(x => end(x) > start(x));

        RuleFor(x => x)
            .Must(x => (end(x) - start(x)).TotalHours <= MaxDurationHours)
            .OverridePropertyName(EndTimeProperty)
            .WithMessage($"Programarea nu poate depăși {MaxDurationHours} ore.")
            .When(x => end(x) > start(x));

        RuleFor(x => x)
            .Must(x => start(x).Date == end(x).Date)
            .OverridePropertyName(EndTimeProperty)
            .WithMessage("Programarea trebuie să se încheie în aceeași zi.")
            .When(x => end(x) > start(x));
    }
}
