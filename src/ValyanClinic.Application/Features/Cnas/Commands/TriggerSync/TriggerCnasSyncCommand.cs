using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Cnas.Commands.TriggerSync;

/// <summary>Declanșează sincronizarea manuală a nomenclatorului CNAS în background.</summary>
public sealed record TriggerCnasSyncCommand : IRequest<Result<Guid>>;
