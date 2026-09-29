using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Users.DTOs;

namespace ValyanClinic.Application.Features.Users.Queries.GetPasswordPolicy;

public sealed class GetPasswordPolicyQueryHandler(ISecuritySettingsProvider settingsProvider)
    : IRequestHandler<GetPasswordPolicyQuery, Result<PasswordPolicyDto>>
{
    public async Task<Result<PasswordPolicyDto>> Handle(
        GetPasswordPolicyQuery request, CancellationToken cancellationToken)
    {
        var settings = await settingsProvider.GetAsync(cancellationToken);

        return Result<PasswordPolicyDto>.Success(new PasswordPolicyDto
        {
            MinLength            = settings.PasswordMinLength,
            MaxLength            = settings.PasswordMaxLength,
            MinDigits            = settings.PasswordMinDigits,
            MinSpecial           = settings.PasswordMinSpecial,
            MinUppercase         = settings.PasswordMinUppercase,
            MinLowercase         = settings.PasswordMinLowercase,
            ForbidIdentityValues = settings.PasswordForbidIdentityValues,
        });
    }
}
