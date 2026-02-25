using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Users.DTOs;

namespace ValyanClinic.Application.Features.Users.Queries.GetUserById;

/// <summary>Obținere utilizator după Id.</summary>
public sealed record GetUserByIdQuery(Guid Id) : IRequest<Result<UserDetailDto>>;
