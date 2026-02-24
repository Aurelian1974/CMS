using FluentValidation;

namespace ValyanClinic.Application.Features.Clinics.Commands.CreateClinicLocation;

public sealed class CreateClinicLocationCommandValidator : AbstractValidator<CreateClinicLocationCommand>
{
    public CreateClinicLocationCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Denumirea locației este obligatorie.")
            .MaximumLength(200).WithMessage("Denumirea nu poate depăși 200 de caractere.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Adresa locației este obligatorie.")
            .MaximumLength(500).WithMessage("Adresa nu poate depăși 500 de caractere.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("Orașul este obligatoriu.")
            .MaximumLength(100).WithMessage("Orașul nu poate depăși 100 de caractere.");

        RuleFor(x => x.County)
            .NotEmpty().WithMessage("Județul este obligatoriu.")
            .MaximumLength(100).WithMessage("Județul nu poate depăși 100 de caractere.");

        RuleFor(x => x.PostalCode)
            .MaximumLength(10).WithMessage("Codul poștal nu poate depăși 10 caractere.")
            .Matches(@"^\d{6}$").When(x => !string.IsNullOrEmpty(x.PostalCode))
            .WithMessage("Codul poștal trebuie să conțină 6 cifre.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Numărul de telefon nu poate depăși 20 de caractere.");

        RuleFor(x => x.Email)
            .MaximumLength(200).WithMessage("Email-ul nu poate depăși 200 de caractere.")
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("Adresa de email nu este validă.");
    }
}
