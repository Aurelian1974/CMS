using FluentValidation;

namespace ValyanClinic.Application.Features.Payments.Commands.CancelPayment;

public sealed class CancelPaymentCommandValidator : AbstractValidator<CancelPaymentCommand>
{
    public CancelPaymentCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Motivul anulării este obligatoriu.")
            .MaximumLength(500).WithMessage("Motivul nu poate depăși 500 de caractere.");
    }
}
