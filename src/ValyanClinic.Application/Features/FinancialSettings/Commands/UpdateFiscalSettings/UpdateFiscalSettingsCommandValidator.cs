using FluentValidation;

namespace ValyanClinic.Application.Features.FinancialSettings.Commands.UpdateFiscalSettings;

public sealed class UpdateFiscalSettingsCommandValidator : AbstractValidator<UpdateFiscalSettingsCommand>
{
    public UpdateFiscalSettingsCommandValidator()
    {
        // Payload-ul bonului (sume, denumiri servicii) pleacă din browser doar către PC-ul local
        RuleFor(x => x.BridgeUrl)
            .NotEmpty().WithMessage("Adresa fiscal bridge-ului este obligatorie.")
            .MaximumLength(200)
            .Must(BeLoopbackHttpUrl)
            .WithMessage("Fiscal bridge-ul trebuie să ruleze local (ex: http://127.0.0.1:5199).");

        RuleFor(x => x.VatMappings).NotNull();
        RuleForEach(x => x.VatMappings).ChildRules(m =>
        {
            m.RuleFor(v => v.VatRateId).NotEmpty();
            m.RuleFor(v => v.TaxGroup).MaximumLength(5).WithMessage("Grupa TVA are cel mult 5 caractere.");
        });

        RuleFor(x => x.PaymentMappings).NotNull();
        RuleForEach(x => x.PaymentMappings).ChildRules(m =>
        {
            m.RuleFor(p => p.PaymentMethodId).NotEmpty();
            m.RuleFor(p => p.DevicePaymentCode).MaximumLength(5).WithMessage("Codul de plată are cel mult 5 caractere.");
        });
    }

    private static bool BeLoopbackHttpUrl(string? value)
        => Uri.TryCreate(value, UriKind.Absolute, out var uri)
           && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
           && uri.IsLoopback;
}
