using FluentValidation;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Validation;

namespace ValyanClinic.Application.Features.Users.Commands.CreateUser;

public sealed class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator(IPasswordPolicyChecker policy)
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

        // Politica vine din Setări securitate, citită la fiecare validare
        RuleFor(x => x.Password)
            .CustomAsync(async (password, ctx, ct) =>
            {
                var cmd = ctx.InstanceToValidate;
                var identity = new[] { cmd.Email, cmd.Username, cmd.FirstName, cmd.LastName };

                foreach (var error in await policy.ValidateAsync(password, identity, ct))
                    ctx.AddFailure(nameof(CreateUserCommand.Password), error);
            });

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
