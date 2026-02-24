using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Clinics.DTOs;

namespace ValyanClinic.Application.Features.Clinics.Queries.GetCurrentClinic;

/// <summary>Query — returnează datele clinicii curente (din JWT ClinicId).</summary>
public sealed record GetCurrentClinicQuery : IRequest<Result<ClinicDto>>;
