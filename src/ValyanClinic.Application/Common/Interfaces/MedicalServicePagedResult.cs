using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Tariffs.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

public sealed record MedicalServicePagedResult(
    PagedResult<MedicalServiceListDto> Paged,
    MedicalServiceStatsDto Stats);
