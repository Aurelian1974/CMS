using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.ResetUserPassword;

/// <summary>
/// Setează o parolă nouă pentru alt utilizator, marchează contul ca necesitând
/// schimbare la următoarea autentificare și revocă sesiunile existente.
/// </summary>
public sealed class ResetUserPasswordCommandHandler(
    IUserRepository repository,
    IAuthRepository authRepository,
    IPasswordHasher passwordHasher,
    ICurrentUser currentUser)
    : IRequestHandler<ResetUserPasswordCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        ResetUserPasswordCommand request, CancellationToken ct)
    {
        // Resetul administrativ nu e calea pentru propria parolă: acolo parola curentă
        // e obligatorie, iar ocolirea ei ar goli de sens verificarea.
        if (request.UserId == currentUser.Id)
            return Result<bool>.Failure(ErrorMessages.User.UseSelfServiceForOwnPassword);

        try
        {
            var passwordHash = passwordHasher.HashPassword(request.NewPassword);

            await repository.UpdatePasswordAsync(
                request.UserId,
                currentUser.ClinicId,
                passwordHash,
                currentUser.Id,
                mustChangePassword: true,
                ct);

            // Parola veche nu mai e validă — nici sesiunile deschise cu ea nu trebuie să fie.
            await authRepository.RevokeAllRefreshTokensAsync(request.UserId, ct);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == SqlErrorCodes.UserNotFound)
        {
            return Result<bool>.NotFound(ErrorMessages.User.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
