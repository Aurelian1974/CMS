using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Tariffs.DTOs;

public sealed class MedicalServicesPagedResponse
{
    public required PagedResult<MedicalServiceListDto> PagedResult { get; init; }
    public required MedicalServiceStatsDto Stats { get; init; }
}
