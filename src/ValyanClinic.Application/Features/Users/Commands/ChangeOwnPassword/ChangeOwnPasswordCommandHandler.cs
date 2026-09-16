using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.ChangeOwnPassword;

/// <summary>
/// Verifică parola curentă, o înlocuiește, stinge flag-ul MustChangePassword și
/// revocă sesiunile deschise cu parola veche.
/// </summary>
public sealed class ChangeOwnPasswordCommandHandler(
    IUserRepository repository,
    IAuthRepository authRepository,
    IPasswordHasher passwordHasher,
    ICurrentUser currentUser,
    ISecuritySettingsProvider settingsProvider,
    ISecurityEventLogger securityLog)
    : IRequestHandler<ChangeOwnPasswordCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        ChangeOwnPasswordCommand request, CancellationToken ct)
    {
        var userId = currentUser.Id;

        var user = await authRepository.GetUserByIdForTokenAsync(userId, ct);
        if (user is null)
            return Result<bool>.NotFound(ErrorMessages.User.NotFound);

        if (!passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            await securityLog.LogAsync(
                SecurityEventTypes.PasswordChanged, succeeded: false,
                userId: userId, clinicId: currentUser.ClinicId,
                details: "Parola curenta incorecta.", ct: ct);

            return Result<bool>.Unauthorized(ErrorMessages.User.CurrentPasswordIncorrect);
        }

        if (passwordHasher.VerifyPassword(request.NewPassword, user.PasswordHash))
            return Result<bool>.Failure(ErrorMessages.User.PasswordUnchanged);

        // Reutilizarea parolelor recente, daca istoricul e activat. Verificarea
        // inseamna cate un BCrypt verify per intrare, deci costa — dar numai la
        // schimbarea parolei, nu la fiecare autentificare.
        var settings = await settingsProvider.GetAsync(ct);
        if (settings.PasswordHistoryCount > 0)
        {
            var recent = await repository.GetRecentPasswordHashesAsync(
                userId, settings.PasswordHistoryCount, ct);

            if (recent.Any(hash => passwordHasher.VerifyPassword(request.NewPassword, hash)))
                return Result<bool>.Failure(string.Format(
                    ErrorMessages.User.PasswordRecentlyUsed, settings.PasswordHistoryCount));
        }

        try
        {
            var passwordHash = passwordHasher.HashPassword(request.NewPassword);

            await repository.UpdatePasswordAsync(
                userId,
                currentUser.ClinicId,
                passwordHash,
                userId,
                mustChangePassword: false,
                ct);

            if (settings.PasswordHistoryCount > 0)
            {
                // Pastram hash-ul VECHI: istoricul exista ca sa interzica intoarcerea
                // la parole abandonate, iar cea noua e deja in Users.PasswordHash.
                await repository.AddPasswordHistoryAsync(
                    userId, user.PasswordHash, settings.PasswordHistoryCount, ct);
            }

            // Sesiunile deschise cu parola veche trebuie să cadă.
            await authRepository.RevokeAllRefreshTokensAsync(userId, ct);

            await securityLog.LogAsync(
                SecurityEventTypes.PasswordChanged, succeeded: true,
                userId: userId, clinicId: currentUser.ClinicId, ct: ct);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.UserNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.User.NotFound);
        }
    }
}
