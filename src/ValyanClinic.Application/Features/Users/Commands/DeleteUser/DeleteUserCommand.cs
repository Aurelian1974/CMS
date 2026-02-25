using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.DeleteUser;

/// <summary>Soft delete utilizator.</summary>
public sealed record DeleteUserCommand(Guid Id) : IRequest<Result<bool>>;
