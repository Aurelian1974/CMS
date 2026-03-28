using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Anm.Commands.TriggerSync;

public sealed record TriggerAnmSyncCommand : IRequest<Result<Guid>>;
