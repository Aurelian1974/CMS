using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ICD10.Commands.AddICD10Favorite;

public sealed class AddICD10FavoriteCommandHandler(
    IICD10Repository repository,
    ICurrentUser currentUser)
    : IRequestHandler<AddICD10FavoriteCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        AddICD10FavoriteCommand request, CancellationToken cancellationToken)
    {
        var success = await repository.AddFavoriteAsync(
            currentUser.Id, request.ICD10_ID, cancellationToken);

        return Result<bool>.Success(success);
    }
}
