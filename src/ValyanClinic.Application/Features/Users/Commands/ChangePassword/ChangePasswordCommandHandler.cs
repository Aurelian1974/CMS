using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.ChangePassword;

public sealed class ChangePasswordCommandHandler(
    IUserRepository repository,
    IAuthRepository authRepository,
    IPasswordHasher passwordHasher,
    ICurrentUser currentUser)
    : IRequestHandler<ChangePasswordCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        // Dacă utilizatorul își schimbă propria parolă, verificăm parola curentă
        if (request.UserId == currentUser.Id)
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                return Result<bool>.Failure("Parola curentă este obligatorie când îți schimbi propria parolă.");

            var user = await authRepository.GetUserByIdForTokenAsync(request.UserId, cancellationToken);
            if (user is null)
                return Result<bool>.NotFound(ErrorMessages.User.NotFound);

            if (!passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
                return Result<bool>.Unauthorized("Parola curentă este incorectă.");
        }

        try
        {
            var passwordHash = passwordHasher.HashPassword(request.NewPassword);

            await repository.UpdatePasswordAsync(
                request.UserId,
                currentUser.ClinicId,
                passwordHash,
                currentUser.Id,
                cancellationToken);

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
