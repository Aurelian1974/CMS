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

        RuleFor(x => x.CaenCodeIds)
            .NotNull().WithMessage("Lista codurilor CAEN nu poate fi null.");

        RuleFor(x => x.LegalRepresentative)
            .MaximumLength(200).WithMessage("Numele reprezentantului legal nu poate depăși 200 de caractere.");

        RuleFor(x => x.ContractCNAS)
            .MaximumLength(50).WithMessage("Numărul contractului CNAS nu poate depăși 50 de caractere.");
    }
}
