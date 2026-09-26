using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Prescriptions.DTOs;

public sealed class PrescriptionsPagedResponse
{
    public required PagedResult<PrescriptionListDto> PagedResult { get; init; }
    public required PrescriptionStatsDto Stats { get; init; }
}
