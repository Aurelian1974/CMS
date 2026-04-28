using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.RecommendedAnalyses.Commands.CreateRecommendedAnalysis;

public sealed class CreateRecommendedAnalysisCommandHandler(
    IRecommendedAnalysisRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateRecommendedAnalysisCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateRecommendedAnalysisCommand request, CancellationToken ct)
    {
        try
        {
            var data = new RecommendedAnalysisCreateData(
                ClinicId: currentUser.ClinicId,
                ConsultationId: request.ConsultationId,
                PatientId: request.PatientId,
                AnalysisId: request.AnalysisId,
                Priority: request.Priority,
                Notes: request.Notes,
                Status: request.Status);

            var id = await repository.CreateAsync(data, currentUser.Id, ct);
            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationNotFound)
        {
            return Result<Guid>.NotFound(ErrorMessages.Consultation.NotFound);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.ConsultationLocked)
        {
            return Result<Guid>.Failure(ErrorMessages.Consultation.Locked);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AnalysisNotFound)
        {
            return Result<Guid>.NotFound(ErrorMessages.RecommendedAnalysis.AnalysisNotInDictionary);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
