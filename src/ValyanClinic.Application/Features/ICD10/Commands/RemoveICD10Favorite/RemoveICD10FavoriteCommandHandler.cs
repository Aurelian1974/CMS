using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.ICD10.Commands.RemoveICD10Favorite;

public sealed class RemoveICD10FavoriteCommandHandler(
    IICD10Repository repository,
    ICurrentUser currentUser)
    : IRequestHandler<RemoveICD10FavoriteCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        RemoveICD10FavoriteCommand request, CancellationToken cancellationToken)
    {
        var success = await repository.RemoveFavoriteAsync(
            currentUser.Id, request.ICD10_ID, cancellationToken);

        return Result<bool>.Success(success);
    }
}
