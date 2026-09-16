using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.ResetUserPassword;

/// <summary>
/// Reset administrativ: un administrator stabilește o parolă nouă pentru alt
/// utilizator, fără să o cunoască pe cea veche. Parola rezultată e cunoscută de
/// administrator, deci contul primește MustChangePassword = 1.
/// </summary>
public sealed record ResetUserPasswordCommand(
    Guid UserId,
    string NewPassword
) : IRequest<Result<bool>>;
