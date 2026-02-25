using MediatR;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Auth.Commands.Login;

namespace ValyanClinic.Application.Features.Auth.Commands.RefreshToken;

/// <summary>
/// Comandă pentru reîmprospătare token — rotație refresh token.
/// </summary>
public sealed record RefreshTokenCommand(
    string Token,
    string? IpAddress
) : IRequest<Result<LoginResponseDto>>;
