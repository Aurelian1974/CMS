using FluentValidation;

namespace ValyanClinic.Application.Features.Departments.Commands.CreateDepartment;

public sealed class CreateDepartmentCommandValidator : AbstractValidator<CreateDepartmentCommand>
{
    public CreateDepartmentCommandValidator()
    {
        RuleFor(x => x.LocationId)
            .NotEmpty().WithMessage("Locația este obligatorie.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Denumirea departamentului este obligatorie.")
            .MaximumLength(200).WithMessage("Denumirea nu poate depăși 200 de caractere.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Codul departamentului este obligatoriu.")
            .MaximumLength(20).WithMessage("Codul nu poate depăși 20 de caractere.")
            .Matches(@"^[A-Z0-9_-]+$").WithMessage("Codul poate conține doar litere mari, cifre, - și _.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Descrierea nu poate depăși 500 de caractere.");
    }
}
