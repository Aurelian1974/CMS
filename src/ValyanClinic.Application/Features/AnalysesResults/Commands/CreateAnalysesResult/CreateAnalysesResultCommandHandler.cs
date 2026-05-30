using System.Text.Json;
using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;

namespace ValyanClinic.Application.Features.AnalysesResults.Commands.CreateAnalysesResult;

public sealed class CreateAnalysesResultCommandHandler(
    IAnalysesResultRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<CreateAnalysesResultCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateAnalysesResultCommand request, CancellationToken cancellationToken)
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
                    notes          = d.Notes,
                    category       = d.Category,
                    subcategory    = d.Subcategory
                }));

            var data = new AnalysesResultSaveData
            {
                ClinicId       = currentUser.ClinicId,
                PatientId      = request.PatientId,
                ConsultationId = request.ConsultationId,
                Laboratory     = request.Laboratory,
                BulletinNumber = request.BulletinNumber,
                CollectionDate = request.CollectionDate,
                ResultDate     = request.ResultDate,
                DoctorName     = request.DoctorName,
                DetailsJson    = detailsJson
            };

            var id = await repository.CreateAsync(data, currentUser.Id, cancellationToken);
            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
