using System.Text.Json;
using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.UserMenuPreferences.Commands.UpsertUserMenuPreferences;

public sealed class UpsertUserMenuPreferencesCommandHandler(
    IUserMenuPreferenceRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<UpsertUserMenuPreferencesCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        UpsertUserMenuPreferencesCommand request, CancellationToken ct)
    {
        try
        {
            var json = JsonSerializer.Serialize(request.FavoriteRoutes);

            await repository.UpsertFavoriteRoutesAsync(
                currentUser.Id, currentUser.ClinicId, json, currentUser.Id, ct);

            return Result<bool>.Success(true);
        }
        catch (SqlException ex) when (ex.Number >= 50000 && ex.Number < 60000)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }
}
