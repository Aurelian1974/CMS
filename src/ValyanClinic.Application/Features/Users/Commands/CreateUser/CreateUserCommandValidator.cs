using FluentValidation;

namespace ValyanClinic.Application.Features.Users.Commands.CreateUser;

public sealed class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.RoleId)
            .NotEmpty().WithMessage("Rolul este obligatoriu.");

        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username-ul este obligatoriu.")
            .MaximumLength(100).WithMessage("Username-ul nu poate depăși 100 de caractere.")
            .Matches(@"^[a-zA-Z0-9._-]+$").WithMessage("Username-ul poate conține doar litere, cifre, puncte, cratime și underscore.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Adresa de email este obligatorie.")
            .MaximumLength(200).WithMessage("Adresa de email nu poate depăși 200 de caractere.")
            .EmailAddress().WithMessage("Adresa de email nu este validă.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Parola este obligatorie.")
            .MinimumLength(6).WithMessage("Parola trebuie să aibă minimum 6 caractere.")
            .MaximumLength(100).WithMessage("Parola nu poate depăși 100 de caractere.");

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Prenumele este obligatoriu.")
            .MaximumLength(100).WithMessage("Prenumele nu poate depăși 100 de caractere.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Numele este obligatoriu.")
            .MaximumLength(100).WithMessage("Numele nu poate depăși 100 de caractere.");

        // Exact unul din DoctorId/MedicalStaffId trebuie completat
        RuleFor(x => x)
            .Must(x => (x.DoctorId.HasValue && !x.MedicalStaffId.HasValue)
                    || (!x.DoctorId.HasValue && x.MedicalStaffId.HasValue))
            .WithMessage("Selectați fie un doctor, fie un membru al personalului medical.");
    }
}
