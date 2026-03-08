using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.SyncClinicCaenCodes;

/// <summary>Sincronizează codurile CAEN asociate clinicii curente (înlocuiește lista complet).</summary>
public sealed record SyncClinicCaenCodesCommand(
    IEnumerable<Guid> CaenCodeIds) : IRequest<Result<bool>>;
