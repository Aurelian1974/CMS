using FluentValidation;

namespace ValyanClinic.Application.Features.ConsultationMedications;

public static class MedicationDoseRules
{
    public const decimal MaxDose = 20m;
    public const decimal DoseStep = 0.25m;

    /// <summary>Doza per priză: opțională, între 0,25 și 20, în pași de ¼ (fracțiuni de comprimat).</summary>
    public static IRuleBuilderOptions<T, decimal?> ValidDose<T>(this IRuleBuilder<T, decimal?> rule, string momentLabel) =>
        rule.Must(d => d is null || (d > 0 && d <= MaxDose && d % DoseStep == 0))
            .WithMessage($"Doza de {momentLabel} trebuie să fie între {DoseStep} și {MaxDose}, în pași de {DoseStep}.");
}
