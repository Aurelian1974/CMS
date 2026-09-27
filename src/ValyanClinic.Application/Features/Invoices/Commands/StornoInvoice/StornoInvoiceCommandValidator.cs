using FluentValidation;

namespace ValyanClinic.Application.Features.Invoices.Commands.StornoInvoice;

public sealed class StornoInvoiceCommandValidator : AbstractValidator<StornoInvoiceCommand>
{
    public StornoInvoiceCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.IdempotencyKey).NotEmpty().WithMessage("Cheia de idempotență lipsește.");
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Motivul stornării este obligatoriu.")
            .MaximumLength(500).WithMessage("Motivul nu poate depăși 500 de caractere.");
    }
}
