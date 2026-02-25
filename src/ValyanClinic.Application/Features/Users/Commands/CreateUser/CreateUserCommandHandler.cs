using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Users.Commands.CreateUser;

public sealed class CreateUserCommandHandler(
    IUserRepository repository,
    IPasswordHasher passwordHasher,
    ICurrentUser currentUser)
    : IRequestHandler<CreateUserCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateUserCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Hash-uire parolă cu BCrypt
            var passwordHash = passwordHasher.HashPassword(request.Password);

            var id = await repository.CreateAsync(
                currentUser.ClinicId,
                request.RoleId,
                request.DoctorId,
                request.MedicalStaffId,
                request.Username,
                request.Email,
                passwordHash,
                request.FirstName,
                request.LastName,
                request.IsActive,
                currentUser.Id,
                cancellationToken);

            return Result<Guid>.Created(id);
        }
        catch (SqlException ex) when (ex.Number == 50500)
        {
            return Result<Guid>.Conflict(ErrorMessages.User.EmailDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50508)
        {
            return Result<Guid>.Conflict(ErrorMessages.User.UsernameDuplicate);
        }
        catch (SqlException ex) when (ex.Number == 50501)
        {
            return Result<Guid>.Failure(ErrorMessages.User.InvalidAssociation);
        }
        catch (SqlException ex) when (ex.Number == 50502)
        {
            return Result<Guid>.Failure(ErrorMessages.User.InvalidDoctor);
        }
        catch (SqlException ex) when (ex.Number == 50503)
        {
            return Result<Guid>.Failure(ErrorMessages.User.InvalidMedicalStaff);
        }
        catch (SqlException ex) when (ex.Number == 50504)
        {
            return Result<Guid>.Failure(ErrorMessages.User.InvalidRole);
        }
        catch (SqlException ex) when (ex.Number == 50505)
        {
            return Result<Guid>.Conflict(ErrorMessages.User.DoctorAlreadyLinked);
        }
        catch (SqlException ex) when (ex.Number == 50506)
        {
            return Result<Guid>.Conflict(ErrorMessages.User.MedicalStaffAlreadyLinked);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<Guid>.Failure(ex.Message);
        }
    }
}
