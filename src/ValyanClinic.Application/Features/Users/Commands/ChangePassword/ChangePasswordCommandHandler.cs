using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.ChangePassword;

public sealed class ChangePasswordCommandHandler(
    IUserRepository repository,
    IPasswordHasher passwordHasher,
    ICurrentUser currentUser)
    : IRequestHandler<ChangePasswordCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        ChangePasswordCommand request, CancellationToken cancellationToken)
    {
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
        catch (SqlException ex) when (ex.Number == 50507)
        {
            return Result<bool>.NotFound(ErrorMessages.User.NotFound);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
