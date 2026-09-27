using FluentValidation;

namespace ValyanClinic.Application.Features.Dashboard.Queries.GetDashboard;

public sealed class GetDashboardQueryValidator : AbstractValidator<GetDashboardQuery>
{
    public const int MinTrendDays = 7;
    public const int MaxTrendDays = 180;

    public GetDashboardQueryValidator()
    {
        // Plafonul există și în SP: validatorul protejează API-ul, SP-ul baza de date.
        RuleFor(x => x.TrendDays)
            .InclusiveBetween(MinTrendDays, MaxTrendDays)
            .WithMessage($"Perioada pentru grafice trebuie să fie între {MinTrendDays} și {MaxTrendDays} de zile.");
    }
}
