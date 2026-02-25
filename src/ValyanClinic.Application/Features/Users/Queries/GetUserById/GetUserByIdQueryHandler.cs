using MediatR;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Users.DTOs;

namespace ValyanClinic.Application.Features.Users.Queries.GetUserById;

public sealed class GetUserByIdQueryHandler(
    IUserRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetUserByIdQuery, Result<UserDetailDto>>
{
    public async Task<Result<UserDetailDto>> Handle(
        GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await repository.GetByIdAsync(
            request.Id,
            currentUser.ClinicId,
            cancellationToken);

        return user is not null
            ? Result<UserDetailDto>.Success(user)
            : Result<UserDetailDto>.NotFound(ErrorMessages.User.NotFound);
    }
}
