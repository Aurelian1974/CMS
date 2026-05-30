using FluentValidation;

namespace ValyanClinic.Application.Features.AnalysesResults.Commands.CreateAnalysesResult;

public sealed class CreateAnalysesResultCommandValidator : AbstractValidator<CreateAnalysesResultCommand>
{
    public CreateAnalysesResultCommandValidator()
    {
        RuleFor(x => x.PatientId)
            .NotEmpty().WithMessage("Pacientul este obligatoriu.");

        RuleFor(x => x.CollectionDate)
            .NotEmpty().WithMessage("Data recoltarii este obligatorie.")
            .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today).AddDays(1))
            .WithMessage("Data recoltarii nu poate fi in viitor.");

        RuleFor(x => x.Laboratory)
            .MaximumLength(200).WithMessage("Laboratorul nu poate depasi 200 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.Laboratory));

        RuleFor(x => x.BulletinNumber)
            .MaximumLength(100).WithMessage("Numarul buletinului nu poate depasi 100 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.BulletinNumber));

        RuleFor(x => x.DoctorName)
            .MaximumLength(300).WithMessage("Numele medicului nu poate depasi 300 de caractere.")
            .When(x => !string.IsNullOrEmpty(x.DoctorName));

        RuleFor(x => x.Details)
            .NotEmpty().WithMessage("Buletinul trebuie sa contina cel putin o analiza.");

        RuleForEach(x => x.Details).ChildRules(row =>
        {
            row.RuleFor(r => r.TestName)
               .NotEmpty().WithMessage("Numele analizei este obligatoriu.")
               .MaximumLength(300).WithMessage("Numele analizei nu poate depasi 300 de caractere.");

            row.RuleFor(r => r.Value)
               .NotEmpty().WithMessage("Valoarea analizei este obligatorie.")
               .MaximumLength(200).WithMessage("Valoarea nu poate depasi 200 de caractere.");

            row.RuleFor(r => r.Section)
               .MaximumLength(100).WithMessage("Sectiunea nu poate depasi 100 de caractere.")
               .When(r => !string.IsNullOrEmpty(r.Section));
        });
    }
}
