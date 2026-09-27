using FluentValidation;

namespace ValyanClinic.Application.Features.Invoices.Commands.CreateInvoice;

public sealed class CreateInvoiceCommandValidator : AbstractValidator<CreateInvoiceCommand>
{
    public CreateInvoiceCommandValidator()
    {
        RuleFor(x => x.ConsultationId).NotEmpty().WithMessage("Consultația este obligatorie.");
        RuleFor(x => x.IdempotencyKey).NotEmpty().WithMessage("Cheia de idempotență lipsește.");

        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage("Numele clientului este obligatoriu.")
            .MaximumLength(200).WithMessage("Numele clientului nu poate depăși 200 de caractere.");

        RuleFor(x => x.CustomerFiscalCode)
            .NotEmpty().WithMessage("CUI-ul este obligatoriu pentru persoane juridice.")
            .When(x => x.CustomerIsLegalEntity);

        RuleFor(x => x.CustomerFiscalCode)
            .MaximumLength(20)
            .Matches(@"^(RO)?\d{2,10}$").WithMessage("CUI-ul nu are un format valid (ex: RO12345678 sau 12345678).")
            .When(x => !string.IsNullOrWhiteSpace(x.CustomerFiscalCode));

        RuleFor(x => x.CustomerAddress)
            .NotEmpty().WithMessage("Adresa este obligatorie pentru persoane juridice.")
            .When(x => x.CustomerIsLegalEntity);

        RuleFor(x => x.CustomerAddress).MaximumLength(500);
        RuleFor(x => x.CustomerCity).MaximumLength(100);
        RuleFor(x => x.CustomerCounty).MaximumLength(100);
        RuleFor(x => x.CustomerTradeRegisterNumber).MaximumLength(30);

        RuleForEach(x => x.Lines).ChildRules(line =>
        {
            line.RuleFor(l => l.Name).NotEmpty().WithMessage("Denumirea liniei este obligatorie.").MaximumLength(200);
            line.RuleFor(l => l.Code).MaximumLength(30);
            line.RuleFor(l => l.Quantity)
                .GreaterThan(0).WithMessage("Cantitatea trebuie să fie mai mare decât zero.")
                .PrecisionScale(10, 3, true);
            line.RuleFor(l => l.UnitPrice)
                .GreaterThanOrEqualTo(0).WithMessage("Prețul nu poate fi negativ.")
                .PrecisionScale(18, 2, true).WithMessage("Prețul poate avea cel mult 2 zecimale.");
            line.RuleFor(l => l.VatRateId).NotEmpty().WithMessage("Regimul TVA este obligatoriu.");
        }).When(x => x.Lines is not null);
    }
}
