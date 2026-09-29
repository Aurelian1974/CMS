using FluentValidation;
using ValyanClinic.Application.Common.Constants;

namespace ValyanClinic.Application.Features.Users.Commands.UpdateUser;

public sealed class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
{
    public UpdateUserCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id-ul utilizatorului este obligatoriu.");

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

        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("Prenumele este obligatoriu.")
            .MaximumLength(100).WithMessage("Prenumele nu poate depăși 100 de caractere.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Numele este obligatoriu.")
            .MaximumLength(100).WithMessage("Numele nu poate depăși 100 de caractere.");

        RuleFor(x => x)
            .Must(x => new[] { x.DoctorId, x.MedicalStaffId, x.AdministrativeStaffId }.Count(id => id.HasValue) == 1)
            .WithMessage(ErrorMessages.User.InvalidAssociation);
    }
}
