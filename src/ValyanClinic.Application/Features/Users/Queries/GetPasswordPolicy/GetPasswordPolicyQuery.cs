using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Users.DTOs;

namespace ValyanClinic.Application.Features.Users.Queries.GetPasswordPolicy;

/// <summary>Politica de parole din Setări securitate.</summary>
public sealed record GetPasswordPolicyQuery : IRequest<Result<PasswordPolicyDto>>;
