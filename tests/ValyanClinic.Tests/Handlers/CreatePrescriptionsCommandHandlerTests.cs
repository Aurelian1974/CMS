using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Prescriptions.Commands.CreatePrescriptions;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class CreatePrescriptionsCommandHandlerTests
{
    private static readonly Guid ClinicId  = Guid.Parse("A7000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId    = Guid.Parse("B7000001-0000-0000-0000-000000000001");
    private static readonly Guid PatientId = Guid.Parse("C7000001-0000-0000-0000-000000000001");
    private static readonly Guid DoctorId  = Guid.Parse("C7000001-0000-0000-0000-000000000002");
    private static readonly Guid CompensatedId = Guid.Parse("D7000001-0000-0000-0000-000000000001");
    private static readonly Guid SimpleId      = Guid.Parse("D7000001-0000-0000-0000-000000000002");

    private readonly IPrescriptionRepository _repo        = Substitute.For<IPrescriptionRepository>();
    private readonly ICurrentUser            _currentUser = Substitute.For<ICurrentUser>();

    public CreatePrescriptionsCommandHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    private CreatePrescriptionsCommandHandler CreateHandler() => new(_repo, _currentUser);

    private static CreatePrescriptionsCommand ValidCommand() => new(
        PatientId: PatientId,
        DoctorId: DoctorId,
        ConsultationId: null,
        CareTypeId: null,
        InsuredCategoryId: null,
        TreatmentDays: 10,
        Diagnostic: "Hipertensiune arterială",
        DiagnosticCodes: "I10",
        RegistryNumber: null,
        IsContinuation: false,
        ReferralLetterNumber: null,
        Notes: null,
        Items:
        [
            new PrescriptionItemData(null, "W66595005", null, "B", "I10", 1, null, null, 10, null, null),
            new PrescriptionItemData(null, "W63077001", null, null, null, null, null, 1, 10, null, null),
        ]);

    [Fact]
    public async Task Handle_MixedItems_ReturnsCreatedWithAllPrescriptionIds()
    {
        _repo.CreateAsync(Arg.Any<PrescriptionCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns([CompensatedId, SimpleId]);

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(201, result.StatusCode);
        Assert.Equal([CompensatedId, SimpleId], result.Value);
    }

    [Fact]
    public async Task Handle_UsesClinicIdAndUserIdFromCurrentUser()
    {
        _repo.CreateAsync(Arg.Any<PrescriptionCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns([SimpleId]);

        await CreateHandler().Handle(ValidCommand(), default);

        await _repo.Received(1).CreateAsync(
            Arg.Is<PrescriptionCreateData>(d =>
                d.ClinicId == ClinicId && d.PatientId == PatientId && d.DoctorId == DoctorId && d.Items.Count == 2),
            UserId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_SqlBusinessError_ReturnsFailure()
    {
        _repo.CreateAsync(Arg.Any<PrescriptionCreateData>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.CopaymentListInvalid));

        var result = await CreateHandler().Handle(ValidCommand(), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }
}
