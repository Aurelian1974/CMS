using FluentValidation;

namespace ValyanClinic.Application.Features.Appointments.Queries.GetAppointments;

public sealed class GetAppointmentsQueryValidator : AbstractValidator<GetAppointmentsQuery>
{
    public const int MaxPageSize = 200;

    private static readonly string[] AllowedSortFields =
        ["StartTime", "PatientName", "DoctorName", "StatusName", "CreatedAt"];

    public GetAppointmentsQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThan(0).WithMessage("Pagina trebuie să fie cel puțin 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, MaxPageSize)
            .WithMessage($"Dimensiunea paginii trebuie să fie între 1 și {MaxPageSize}.");

        RuleFor(x => x.Search)
            .MaximumLength(200).WithMessage("Termenul de căutare nu poate depăși 200 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Search));

        RuleFor(x => x.SortBy)
            .Must(v => AllowedSortFields.Contains(v, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Câmpul de sortare nu este valid.")
            .When(x => !string.IsNullOrEmpty(x.SortBy));

        RuleFor(x => x.SortDir)
            .Must(v => v.Equals("asc", StringComparison.OrdinalIgnoreCase) || v.Equals("desc", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Direcția de sortare trebuie să fie 'asc' sau 'desc'.")
            .When(x => !string.IsNullOrEmpty(x.SortDir));

        RuleFor(x => x.DateTo)
            .GreaterThanOrEqualTo(x => x.DateFrom)
            .WithMessage("Data 'până la' trebuie să fie după data 'de la'.")
            .When(x => x.DateFrom.HasValue && x.DateTo.HasValue);
    }
}
