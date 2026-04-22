using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Consultations.Commands.DeleteConsultation;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru DeleteConsultationCommandHandler.
/// </summary>
public sealed class DeleteConsultationCommandHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A3000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B3000001-0000-0000-0000-000000000001");
    private static readonly Guid ConsultationId = Guid.Parse("C3000001-0000-0000-0000-000000000001");

    private readonly IConsultationRepository _repo        = Substitute.For<IConsultationRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public DeleteConsultationCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private DeleteConsultationCommandHandler CreateHandler() => new(_repo, _currentUser);

    private static DeleteConsultationCommand ValidCommand() => new(Id: ConsultationId);

    // ── Happy path ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccess()
    {
        _repo.DeleteAsync(ConsultationId, ClinicId, UserId, Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.True(result.Value);
    }

    [Fact]
    public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
    {
        _repo.DeleteAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<CancellationToken>())
             .Returns(Task.CompletedTask);

        await CreateHandler().Handle(ValidCommand(), default);

        await _repo.Received(1).DeleteAsync(
            ConsultationId, ClinicId, UserId, Arg.Any<CancellationToken>());
    }

    // ── Not found ─────────────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_ConsultationNotFound_ReturnsNotFound()
    {
        _repo.DeleteAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationNotFound));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    // ── Generic SQL error ─────────────────────────────────────────────────────

    [Fact]
    public async Task Handle_GenericSqlError_ReturnsFailure()
    {
        _repo.DeleteAsync(
                Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(),
                Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(50999));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
