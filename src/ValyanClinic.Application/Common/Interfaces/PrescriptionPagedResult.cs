using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Prescriptions.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public sealed record PrescriptionPagedResult(
    PagedResult<PrescriptionListDto> Paged,
    PrescriptionStatsDto Stats);
