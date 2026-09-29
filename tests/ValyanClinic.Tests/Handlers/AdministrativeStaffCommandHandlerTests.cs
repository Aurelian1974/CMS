using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.AdministrativeStaff.Commands.CreateAdministrativeStaff;
using ValyanClinic.Application.Features.AdministrativeStaff.Commands.DeleteAdministrativeStaff;
using ValyanClinic.Application.Features.AdministrativeStaff.Commands.UpdateAdministrativeStaff;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

/// <summary>
/// Teste unitare pentru handler-ele de comandă ale personalului administrativ.
/// </summary>
public sealed class AdministrativeStaffCommandHandlerTests
{
    private static readonly Guid ClinicId = Guid.Parse("A7000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId   = Guid.Parse("B7000001-0000-0000-0000-000000000001");
    private static readonly Guid StaffId  = Guid.Parse("C7000001-0000-0000-0000-000000000001");

    private readonly IAdministrativeStaffRepository _repo        = Substitute.For<IAdministrativeStaffRepository>();
    private readonly ICurrentUser                   _currentUser = Substitute.For<ICurrentUser>();

    public AdministrativeStaffCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private static CreateAdministrativeStaffCommand ValidCreate() => new(
        DepartmentId: null,
        PositionId: null,
        FirstName: "Ana",
        LastName: "Ionescu",
        Email: "ana.ionescu@valyan.ro",
        PhoneNumber: null);

    private static UpdateAdministrativeStaffCommand ValidUpdate() => new(
        Id: StaffId,
        DepartmentId: null,
        PositionId: null,
        FirstName: "Ana",
        LastName: "Ionescu",
        Email: "ana.ionescu@valyan.ro",
        PhoneNumber: null,
        IsActive: true);

    // ── Create ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_ValidCommand_ReturnsCreatedWithTenantFromCurrentUser()
    {
        _repo.CreateAsync(Arg.Any<AdministrativeStaffCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns(StaffId);

        var result = await new CreateAdministrativeStaffCommandHandler(_repo, _currentUser)
            .Handle(ValidCreate(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(201, result.StatusCode);
        Assert.Equal(StaffId, result.Value);
        await _repo.Received(1).CreateAsync(
            Arg.Is<AdministrativeStaffCreateData>(d => d.ClinicId == ClinicId),
            UserId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Create_EmailDuplicate_ReturnsConflict()
    {
        _repo.CreateAsync(Arg.Any<AdministrativeStaffCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.AdministrativeStaffEmailDuplicate));

        var result = await new CreateAdministrativeStaffCommandHandler(_repo, _currentUser)
            .Handle(ValidCreate(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(409, result.StatusCode);
    }

    [Fact]
    public async Task Create_InvalidPosition_ReturnsFailure()
    {
        _repo.CreateAsync(Arg.Any<AdministrativeStaffCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.AdministrativeStaffInvalidPosition));

        var result = await new CreateAdministrativeStaffCommandHandler(_repo, _currentUser)
            .Handle(ValidCreate(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal(ErrorMessages.AdministrativeStaffMember.InvalidPosition, result.Error);
    }

    // ── Update ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Update_ValidCommand_ReturnsSuccess()
    {
        var result = await new UpdateAdministrativeStaffCommandHandler(_repo, _currentUser)
            .Handle(ValidUpdate(), default);

        Assert.True(result.IsSuccess);
        await _repo.Received(1).UpdateAsync(
            Arg.Is<AdministrativeStaffUpdateData>(d => d.Id == StaffId && d.ClinicId == ClinicId),
            UserId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Update_NotFound_ReturnsNotFound()
    {
        _repo.UpdateAsync(Arg.Any<AdministrativeStaffUpdateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.AdministrativeStaffNotFound));

        var result = await new UpdateAdministrativeStaffCommandHandler(_repo, _currentUser)
            .Handle(ValidUpdate(), default);

        Assert.Equal(404, result.StatusCode);
    }

    // ── Delete ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ValidCommand_ReturnsSuccess()
    {
        var result = await new DeleteAdministrativeStaffCommandHandler(_repo, _currentUser)
            .Handle(new DeleteAdministrativeStaffCommand(StaffId), default);

        Assert.True(result.IsSuccess);
        await _repo.Received(1).DeleteAsync(StaffId, ClinicId, UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Delete_NotFound_ReturnsNotFound()
    {
        _repo.DeleteAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.AdministrativeStaffNotFound));

        var result = await new DeleteAdministrativeStaffCommandHandler(_repo, _currentUser)
            .Handle(new DeleteAdministrativeStaffCommand(StaffId), default);

        Assert.Equal(404, result.StatusCode);
    }
}
