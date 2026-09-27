using FluentValidation;

namespace ValyanClinic.Application.Features.FinancialSettings.Commands.CreateInvoiceSeries;

public sealed class CreateInvoiceSeriesCommandValidator : AbstractValidator<CreateInvoiceSeriesCommand>
{
    public CreateInvoiceSeriesCommandValidator()
    {
        RuleFor(x => x.Series)
            .NotEmpty().WithMessage("Seria este obligatorie.")
            .Matches("^[A-Za-z0-9]{1,10}$").WithMessage("Seria are 1–10 caractere, doar litere și cifre.");

        RuleFor(x => x.StartNumber)
            .InclusiveBetween(1, 99_999_999).WithMessage("Numărul de start trebuie să fie între 1 și 99.999.999.");
    }
}
