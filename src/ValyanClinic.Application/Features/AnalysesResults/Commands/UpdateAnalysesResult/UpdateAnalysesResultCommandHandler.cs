using System.Text.Json;
using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;

namespace ValyanClinic.Application.Features.AnalysesResults.Commands.UpdateAnalysesResult;

public sealed class UpdateAnalysesResultCommandHandler(
    IAnalysesResultRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateAnalysesResultCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateAnalysesResultCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var detailsJson = JsonSerializer.Serialize(
                request.Details.Select(d => new
                {
                    section        = d.Section,
                    testName       = d.TestName,
                    value          = d.Value,
                    unit           = d.Unit,
                    referenceRange = d.ReferenceRange,
                    refMin         = d.RefMin,
                    refMax         = d.RefMax,
                    flag           = d.Flag,
                    method         = d.Method,
                    notes          = d.Notes
                }));

            var data = new AnalysesResultSaveData
            {
                ClinicId       = currentUser.ClinicId,
                PatientId      = Guid.Empty,   // nu se modifica PatientId la update
                CollectionDate = request.CollectionDate,
                ResultDate     = request.ResultDate,
                Laboratory     = request.Laboratory,
                BulletinNumber = request.BulletinNumber,
                DoctorName     = request.DoctorName,
                DetailsJson    = detailsJson
            };

            await repository.UpdateAsync(request.Id, data, currentUser.Id, cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.AnalysesResultNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.AnalysesResult.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
