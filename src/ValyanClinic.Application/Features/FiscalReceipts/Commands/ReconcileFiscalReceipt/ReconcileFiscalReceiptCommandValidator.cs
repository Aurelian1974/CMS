using FluentValidation;

namespace ValyanClinic.Application.Features.FiscalReceipts.Commands.ReconcileFiscalReceipt;

public sealed class ReconcileFiscalReceiptCommandValidator : AbstractValidator<ReconcileFiscalReceiptCommand>
{
    public ReconcileFiscalReceiptCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();

        RuleFor(x => x.ReceiptNumber)
            .NotEmpty().WithMessage("Introduceți numărul bonului fiscal tipărit.")
            .When(x => x.WasPrinted);

        RuleFor(x => x.ReceiptNumber).MaximumLength(30);
        RuleFor(x => x.Note).MaximumLength(500);
    }
}
