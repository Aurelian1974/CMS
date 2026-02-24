using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Clinics.DTOs;

namespace ValyanClinic.Application.Features.Clinics.Queries.GetClinicLocations;

/// <summary>Query — returnează locațiile clinicii curente, filtrate opțional pe IsActive.</summary>
public sealed record GetClinicLocationsQuery(bool? IsActive = null)
    : IRequest<Result<IEnumerable<ClinicLocationDto>>>;
