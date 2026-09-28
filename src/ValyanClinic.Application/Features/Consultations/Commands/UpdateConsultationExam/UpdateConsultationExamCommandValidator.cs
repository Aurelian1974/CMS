using FluentValidation;

namespace ValyanClinic.Application.Features.Consultations.Commands.UpdateConsultationExam;

public sealed class UpdateConsultationExamCommandValidator : AbstractValidator<UpdateConsultationExamCommand>
{
    public UpdateConsultationExamCommandValidator()
    {
        RuleFor(x => x.ConsultationId)
            .NotEmpty().WithMessage("Id-ul consultației este obligatoriu.");

        RuleFor(x => x.StareGenerala).MaximumLength(50);
        RuleFor(x => x.Tegumente).MaximumLength(50);
        RuleFor(x => x.Mucoase).MaximumLength(50);
        RuleFor(x => x.Edeme).MaximumLength(50);
        RuleFor(x => x.GanglioniLimfatici).MaximumLength(100);

        // Limite de plauzibilitate clinică: 0 nu e o valoare validă pentru un pacient examinat
        RuleFor(x => x.Greutate).InclusiveBetween(0.5m, 500m).When(x => x.Greutate.HasValue);
        RuleFor(x => x.Inaltime).InclusiveBetween(20, 250).When(x => x.Inaltime.HasValue);
        RuleFor(x => x.TensiuneSistolica).InclusiveBetween(40, 300).When(x => x.TensiuneSistolica.HasValue);
        RuleFor(x => x.TensiuneDiastolica).InclusiveBetween(20, 200).When(x => x.TensiuneDiastolica.HasValue);
        RuleFor(x => x.Puls).InclusiveBetween(20, 300).When(x => x.Puls.HasValue);
        RuleFor(x => x.FrecventaRespiratorie).InclusiveBetween(5, 100).When(x => x.FrecventaRespiratorie.HasValue);
        RuleFor(x => x.Temperatura).InclusiveBetween(30, 45m).When(x => x.Temperatura.HasValue);
        RuleFor(x => x.SpO2).InclusiveBetween(50, 100).When(x => x.SpO2.HasValue);
        RuleFor(x => x.Glicemie).InclusiveBetween(10, 1000m).When(x => x.Glicemie.HasValue);

        RuleFor(x => x)
            .Must(x => x.TensiuneSistolica > x.TensiuneDiastolica)
            .OverridePropertyName(nameof(UpdateConsultationExamCommand.TensiuneSistolica))
            .WithMessage("Tensiunea sistolică trebuie să fie mai mare decât cea diastolică.")
            .When(x => x.TensiuneSistolica.HasValue && x.TensiuneDiastolica.HasValue);
    }
}
