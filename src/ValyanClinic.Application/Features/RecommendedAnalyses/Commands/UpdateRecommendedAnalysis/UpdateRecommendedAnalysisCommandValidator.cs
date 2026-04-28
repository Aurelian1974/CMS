using FluentValidation;

namespace ValyanClinic.Application.Features.RecommendedAnalyses.Commands.UpdateRecommendedAnalysis;

public sealed class UpdateRecommendedAnalysisCommandValidator : AbstractValidator<UpdateRecommendedAnalysisCommand>
{
    public UpdateRecommendedAnalysisCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Priority).Must(p => p <= 3);
        RuleFor(x => x.Status).Must(s => s <= 2);
        RuleFor(x => x.Notes).MaximumLength(1000);
    }
}
