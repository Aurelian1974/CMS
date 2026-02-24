using FluentValidation;

namespace ValyanClinic.Application.Features.Clinics.Commands.UpdateClinic;

public sealed class UpdateClinicCommandValidator : AbstractValidator<UpdateClinicCommand>
{
    public UpdateClinicCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Denumirea societății este obligatorie.")
            .MaximumLength(200).WithMessage("Denumirea nu poate depăși 200 de caractere.");

        RuleFor(x => x.FiscalCode)
            .NotEmpty().WithMessage("CUI/CIF-ul este obligatoriu.")
            .MaximumLength(20).WithMessage("CUI/CIF-ul nu poate depăși 20 de caractere.");

        RuleFor(x => x.TradeRegisterNumber)
            .MaximumLength(30).WithMessage("Nr. Registrul Comerțului nu poate depăși 30 de caractere.");

        RuleFor(x => x.CaenCode)
            .MaximumLength(10).WithMessage("Codul CAEN nu poate depăși 10 caractere.")
            .Matches(@"^\d{4}$").When(x => !string.IsNullOrEmpty(x.CaenCode))
            .WithMessage("Codul CAEN trebuie să conțină exact 4 cifre.");

        RuleFor(x => x.LegalRepresentative)
            .MaximumLength(200).WithMessage("Numele reprezentantului legal nu poate depăși 200 de caractere.");

        RuleFor(x => x.ContractCNAS)
            .MaximumLength(50).WithMessage("Numărul contractului CNAS nu poate depăși 50 de caractere.");

        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Adresa sediului social este obligatorie.")
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

        RuleFor(x => x.BankName)
            .MaximumLength(100).WithMessage("Numele băncii nu poate depăși 100 de caractere.");

        RuleFor(x => x.BankAccount)
            .MaximumLength(34).WithMessage("IBAN-ul nu poate depăși 34 de caractere.")
            .Matches(@"^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$").When(x => !string.IsNullOrEmpty(x.BankAccount))
            .WithMessage("IBAN-ul trebuie să fie în format românesc valid (ex: RO49AAAA1B31007593840000).");

        RuleFor(x => x.Email)
            .MaximumLength(200).WithMessage("Email-ul nu poate depăși 200 de caractere.")
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("Adresa de email nu este validă.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Numărul de telefon nu poate depăși 20 de caractere.");

        RuleFor(x => x.Website)
            .MaximumLength(200).WithMessage("Website-ul nu poate depăși 200 de caractere.");
    }
}
