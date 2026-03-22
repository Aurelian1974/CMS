using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Patients.DTOs;

namespace ValyanClinic.Application.Features.Patients.Queries.GetPatientsLookup;

/// <summary>Listare simplificată pacienți per clinică — pentru dropdown-uri.</summary>
public sealed record GetPatientsLookupQuery
    : IRequest<Result<IEnumerable<PatientLookupDto>>>;
