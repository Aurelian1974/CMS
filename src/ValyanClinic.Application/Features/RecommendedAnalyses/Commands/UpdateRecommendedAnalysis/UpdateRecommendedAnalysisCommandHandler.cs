using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.RecommendedAnalyses.Commands.UpdateRecommendedAnalysis;

public sealed class UpdateRecommendedAnalysisCommandHandler(
    IRecommendedAnalysisRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateRecommendedAnalysisCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(UpdateRecommendedAnalysisCommand request, CancellationToken ct)
    {
        try
        {
            var data = new RecommendedAnalysisUpdateData(
                Id: request.Id,
                ClinicId: currentUser.ClinicId,
                Priority: request.Priority,
                Notes: request.Notes,
                Status: request.Status);

            await repository.UpdateAsync(data, currentUser.Id, ct);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.RecommendedAnalysisNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.RecommendedAnalysis.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationLocked)
        {
            return Result<bool>.Failure(ErrorMessages.Consultation.Locked);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
