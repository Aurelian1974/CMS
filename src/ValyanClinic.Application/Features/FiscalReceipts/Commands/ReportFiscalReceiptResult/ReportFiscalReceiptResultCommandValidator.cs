using FluentValidation;
using ValyanClinic.Application.Common.Constants;

namespace ValyanClinic.Application.Features.FiscalReceipts.Commands.ReportFiscalReceiptResult;

public sealed class ReportFiscalReceiptResultCommandValidator : AbstractValidator<ReportFiscalReceiptResultCommand>
{
    private static readonly string[] AllowedStatuses =
        [FiscalReceiptStatusCodes.Printed, FiscalReceiptStatusCodes.Failed, FiscalReceiptStatusCodes.Unknown];

    public ReportFiscalReceiptResultCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();

        RuleFor(x => x.StatusCode)
            .Must(s => AllowedStatuses.Contains(s))
            .WithMessage("Rezultatul tipăririi nu este valid.");

        RuleFor(x => x.ReceiptNumber)
            .NotEmpty().WithMessage("Numărul bonului fiscal este obligatoriu pentru un bon emis.")
            .When(x => x.StatusCode == FiscalReceiptStatusCodes.Printed);

        RuleFor(x => x.ReceiptNumber).MaximumLength(30);
        RuleFor(x => x.DeviceSerialNumber).MaximumLength(30);
        RuleFor(x => x.ErrorMessage).MaximumLength(1000);
        RuleFor(x => x.DeviceResponse).MaximumLength(20_000);
    }
}
