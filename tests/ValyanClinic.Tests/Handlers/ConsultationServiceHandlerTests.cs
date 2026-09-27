using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.ConsultationServices.Commands.AddConsultationService;
using ValyanClinic.Application.Features.ConsultationServices.Commands.DeleteConsultationService;
using ValyanClinic.Application.Features.ConsultationServices.Commands.UpdateConsultationServiceQuantity;
using ValyanClinic.Application.Features.ConsultationServices.DTOs;
using ValyanClinic.Application.Features.ConsultationServices.Queries.GetConsultationServices;
using ValyanClinic.Tests.TestHelpers;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class ConsultationServiceHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A7000002-0000-0000-0000-000000000001");
    private static readonly Guid UserId         = Guid.Parse("B7000002-0000-0000-0000-000000000001");
    private static readonly Guid ConsultationId = Guid.Parse("C7000002-0000-0000-0000-000000000001");
    private static readonly Guid ServiceId      = Guid.Parse("C7000002-0000-0000-0000-000000000002");
    private static readonly Guid LineId         = Guid.Parse("C7000002-0000-0000-0000-000000000003");

    private readonly IConsultationServiceRepository _repo        = Substitute.For<IConsultationServiceRepository>();
    private readonly ICurrentUser                   _currentUser = Substitute.For<ICurrentUser>();

    public ConsultationServiceHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
    }

    [Fact]
    public async Task GetServices_ConsultationPlusSpirometry_TotalIs150()
    {
        _repo.GetByConsultationAsync(ConsultationId, ClinicId, Arg.Any<CancellationToken>())
             .Returns(new List<ConsultationServiceDto>
             {
                 new() { ServiceName = "Consultație", UnitPrice = 100m, Quantity = 1m, LineTotal = 100m },
                 new() { ServiceName = "Spirometrie", UnitPrice = 50m,  Quantity = 1m, LineTotal = 50m },
             });

        var result = await new GetConsultationServicesQueryHandler(_repo, _currentUser)
            .Handle(new GetConsultationServicesQuery(ConsultationId), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(150m, result.Value!.Total);
        Assert.Equal(2, result.Value.Lines.Count);
    }

    [Fact]
    public async Task Add_ValidCommand_ReturnsCreated()
    {
        _repo.AddAsync(ClinicId, ConsultationId, ServiceId, 1m, UserId, Arg.Any<CancellationToken>())
             .Returns(LineId);

        var result = await new AddConsultationServiceCommandHandler(_repo, _currentUser)
            .Handle(new AddConsultationServiceCommand(ConsultationId, ServiceId), default);

        Assert.Equal(201, result.StatusCode);
        Assert.Equal(LineId, result.Value);
    }

    [Fact]
    public async Task Add_BilledConsultation_ReturnsConflict()
    {
        _repo.AddAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<decimal>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.BillingConsultationLocked));

        var result = await new AddConsultationServiceCommandHandler(_repo, _currentUser)
            .Handle(new AddConsultationServiceCommand(ConsultationId, ServiceId), default);

        Assert.False(result.IsSuccess);
        Assert.Equal(409, result.StatusCode);
    }

    [Fact]
    public async Task Add_ConsultationNotFound_ReturnsNotFound()
    {
        _repo.AddAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<decimal>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationNotFound));

        var result = await new AddConsultationServiceCommandHandler(_repo, _currentUser)
            .Handle(new AddConsultationServiceCommand(ConsultationId, ServiceId), default);

        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task UpdateQuantity_BilledConsultation_ReturnsConflict()
    {
        _repo.UpdateQuantityAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<decimal>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.BillingConsultationLocked));

        var result = await new UpdateConsultationServiceQuantityCommandHandler(_repo, _currentUser)
            .Handle(new UpdateConsultationServiceQuantityCommand(LineId, 2m), default);

        Assert.Equal(409, result.StatusCode);
    }

    [Fact]
    public async Task Delete_BilledConsultation_ReturnsConflict()
    {
        _repo.DeleteAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.BillingConsultationLocked));

        var result = await new DeleteConsultationServiceCommandHandler(_repo, _currentUser)
            .Handle(new DeleteConsultationServiceCommand(LineId), default);

        Assert.Equal(409, result.StatusCode);
    }

    [Fact]
    public async Task Delete_LineNotFound_ReturnsNotFound()
    {
        _repo.DeleteAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Throws(SqlExceptionHelper.Make(SqlErrorCodes.ConsultationServiceNotFound));

        var result = await new DeleteConsultationServiceCommandHandler(_repo, _currentUser)
            .Handle(new DeleteConsultationServiceCommand(LineId), default);

        Assert.Equal(404, result.StatusCode);
    }
}
