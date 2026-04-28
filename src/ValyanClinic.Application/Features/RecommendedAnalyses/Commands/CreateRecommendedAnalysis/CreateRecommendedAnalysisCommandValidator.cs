using FluentValidation;

namespace ValyanClinic.Application.Features.RecommendedAnalyses.Commands.CreateRecommendedAnalysis;

public sealed class CreateRecommendedAnalysisCommandValidator : AbstractValidator<CreateRecommendedAnalysisCommand>
{
    public CreateRecommendedAnalysisCommandValidator()
    {
        RuleFor(x => x.ConsultationId).NotEmpty();
        RuleFor(x => x.PatientId).NotEmpty();
        RuleFor(x => x.AnalysisId).NotEmpty();
        RuleFor(x => x.Priority).Must(p => p <= 3).WithMessage("Prioritatea trebuie să fie între 0 și 3.");
        RuleFor(x => x.Status).Must(s => s <= 2).WithMessage("Statusul trebuie să fie între 0 și 2.");
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
