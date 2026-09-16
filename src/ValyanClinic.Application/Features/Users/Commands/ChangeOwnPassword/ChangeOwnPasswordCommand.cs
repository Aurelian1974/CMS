using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.ChangeOwnPassword;

/// <summary>
/// Utilizatorul autentificat își schimbă propria parolă. Id-ul contului vine din
/// token, nu din request: cine e apelantul nu se negociază prin payload.
/// Parola curentă este obligatorie — dovada posesiei contului.
/// </summary>
public sealed record ChangeOwnPasswordCommand(
    string CurrentPassword,
    string NewPassword
) : IRequest<Result<bool>>;
