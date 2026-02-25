using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.MedicalStaff.Commands.DeleteMedicalStaff;

/// <summary>Soft delete personal medical.</summary>
public sealed record DeleteMedicalStaffCommand(Guid Id) : IRequest<Result<bool>>;
