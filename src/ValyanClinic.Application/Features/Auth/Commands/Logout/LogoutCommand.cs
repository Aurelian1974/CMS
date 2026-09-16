using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Auth.Commands.Logout;

/// <summary>
/// Comandă de logout — revocă refresh token-ul curent.
/// </summary>
public sealed record LogoutCommand(
    string? RefreshToken,
    /// <summary>
    /// De ce s-a incheiat sesiunea. "idle" cand clientul deconecteaza pentru
    /// inactivitate; altfel deconectare deliberata. Fara acest motiv, jurnalul nu
    /// poate distinge cele doua cazuri, pentru ca ambele arata ca un logout.
    /// </summary>
    string? Reason = null
) : IRequest<Result<bool>>;
