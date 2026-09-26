using FluentValidation;

namespace ValyanClinic.Application.Features.ConsultationMedications.Queries.SearchCnasDrugs;

public sealed class SearchCnasDrugsQueryValidator : AbstractValidator<SearchCnasDrugsQuery>
{
    public SearchCnasDrugsQueryValidator()
    {
        RuleFor(x => x.Search)
            .Must(s => !string.IsNullOrWhiteSpace(s) && s.Trim().Length >= SearchCnasDrugsQuery.MinSearchLength)
            .WithMessage($"Introduceți cel puțin {SearchCnasDrugsQuery.MinSearchLength} caractere.")
            .MaximumLength(200).WithMessage("Termenul de căutare nu poate depăși 200 de caractere.");

        RuleFor(x => x.Top)
            .InclusiveBetween(1, SearchCnasDrugsQuery.MaxTop)
            .WithMessage($"Numărul de rezultate trebuie să fie între 1 și {SearchCnasDrugsQuery.MaxTop}.");
    }
}
