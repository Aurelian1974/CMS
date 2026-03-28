using FluentValidation;

namespace ValyanClinic.Application.Features.Schedule.Commands;

public sealed class UpsertClinicDayCommandValidator : AbstractValidator<UpsertClinicDayCommand>
{
    public UpsertClinicDayCommandValidator()
    {
        RuleFor(x => x.DayOfWeek)
            .InclusiveBetween((byte)0, (byte)6)
            .WithMessage("Ziua săptămânii trebuie să fie între 0 (Luni) și 6 (Duminică).");

        When(x => x.IsOpen, () =>
        {
            RuleFor(x => x.OpenTime)
                .NotEmpty().WithMessage("Ora de deschidere este obligatorie când clinica este deschisă.")
                .Matches(@"^([01]\d|2[0-3]):[0-5]\d$")
                .WithMessage("Ora de deschidere trebuie să fie în formatul HH:mm.");

            RuleFor(x => x.CloseTime)
                .NotEmpty().WithMessage("Ora de închidere este obligatorie când clinica este deschisă.")
                .Matches(@"^([01]\d|2[0-3]):[0-5]\d$")
                .WithMessage("Ora de închidere trebuie să fie în formatul HH:mm.");
        });
    }
}

public sealed class UpsertDoctorDayCommandValidator : AbstractValidator<UpsertDoctorDayCommand>
{
    public UpsertDoctorDayCommandValidator()
    {
        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("Id-ul doctorului este obligatoriu.");

        RuleFor(x => x.DayOfWeek)
            .InclusiveBetween((byte)0, (byte)6)
            .WithMessage("Ziua săptămânii trebuie să fie între 0 (Luni) și 6 (Duminică).");

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("Ora de start este obligatorie.")
            .Matches(@"^([01]\d|2[0-3]):[0-5]\d$")
            .WithMessage("Ora de start trebuie să fie în formatul HH:mm.");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("Ora de sfârșit este obligatorie.")
            .Matches(@"^([01]\d|2[0-3]):[0-5]\d$")
            .WithMessage("Ora de sfârșit trebuie să fie în formatul HH:mm.");
    }
}

public sealed class DeleteDoctorDayCommandValidator : AbstractValidator<DeleteDoctorDayCommand>
{
    public DeleteDoctorDayCommandValidator()
    {
        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("Id-ul doctorului este obligatoriu.");

        RuleFor(x => x.DayOfWeek)
            .InclusiveBetween((byte)0, (byte)6)
            .WithMessage("Ziua săptămânii trebuie să fie între 0 (Luni) și 6 (Duminică).");
    }
}
