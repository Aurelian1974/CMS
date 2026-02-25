using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.UpdateUser;

public sealed class UpdateUserCommandHandler(
    IUserRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpdateUserCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpdateUserCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await repository.UpdateAsync(
                request.Id,
                currentUser.ClinicId,
                request.RoleId,
                request.DoctorId,
                request.MedicalStaffId,
                request.Username,
                request.Email,
                request.FirstName,
                request.LastName,
                request.IsActive,
                currentUser.Id,
                cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number == 50507)
        {
            return Result<bool>.NotFound(ErrorMessages.User.NotFound);
        }
        catch (SqlException ex) when (ex.Number == 50500)
        {
            return Result<bool>.Conflict(ErrorMessages.User.EmailDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50508)
        {
            return Result<bool>.Conflict(ErrorMessages.User.UsernameDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50501)
        {
            return Result<bool>.Failure(ErrorMessages.User.InvalidAssociation);
        }
        catch (SqlException ex) when (ex.Number == 50502)
        {
            return Result<bool>.Failure(ErrorMessages.User.InvalidDoctor);
        }
        catch (SqlException ex) when (ex.Number == 50503)
        {
            return Result<bool>.Failure(ErrorMessages.User.InvalidMedicalStaff);
        }
        catch (SqlException ex) when (ex.Number == 50504)
        {
            return Result<bool>.Failure(ErrorMessages.User.InvalidRole);
        }
        catch (SqlException ex) when (ex.Number == 50505)
        {
            return Result<bool>.Conflict(ErrorMessages.User.DoctorAlreadyLinked);
        }
        catch (SqlException ex) when (ex.Number == 50506)
        {
            return Result<bool>.Conflict(ErrorMessages.User.MedicalStaffAlreadyLinked);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
