using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.AdministrativeStaff.Commands.DeleteAdministrativeStaff;

/// <summary>Soft delete membru al personalului administrativ.</summary>
public sealed record DeleteAdministrativeStaffCommand(Guid Id) : IRequest<Result<bool>>;
