using NSubstitute;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.FinancialSettings.Commands.CreateBridgePairingTicket;
using ValyanClinic.Application.Features.FinancialSettings.DTOs;
using ValyanClinic.Application.Features.FinancialSettings.Queries.GetBridgePairingKey;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class BridgePairingHandlerTests
{
    private static readonly Guid ClinicId = Guid.Parse("A7000001-0000-0000-0000-000000000001");
    private static readonly Guid UserId   = Guid.Parse("B7000001-0000-0000-0000-000000000001");

    private readonly IBridgePairingTicketIssuer _issuer = Substitute.For<IBridgePairingTicketIssuer>();
    private readonly ICurrentUser _currentUser = Substitute.For<ICurrentUser>();

    public BridgePairingHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
        _currentUser.Id.Returns(UserId);
        _currentUser.Role.Returns(Roles.Admin);
        _issuer.IsConfigured.Returns(true);
    }

    [Fact]
    public async Task CreateTicket_Admin_ReturnsTicketForCurrentUserAndClinic()
    {
        var dto = new BridgePairingTicketDto { Ticket = "p.s" };
        _issuer.Issue(ClinicId, UserId).Returns(dto);

        var result = await new CreateBridgePairingTicketCommandHandler(_issuer, _currentUser)
            .Handle(new CreateBridgePairingTicketCommand(), default);

        Assert.True(result.IsSuccess);
        Assert.Same(dto, result.Value);
    }

    [Theory]
    [InlineData(Roles.Receptionist)]
    [InlineData(Roles.ClinicManager)]
    [InlineData(Roles.Doctor)]
    public async Task CreateTicket_NotAdmin_ReturnsForbidden(string role)
    {
        _currentUser.Role.Returns(role);

        var result = await new CreateBridgePairingTicketCommandHandler(_issuer, _currentUser)
            .Handle(new CreateBridgePairingTicketCommand(), default);

        Assert.Equal(403, result.StatusCode);
        _issuer.DidNotReceive().Issue(Arg.Any<Guid>(), Arg.Any<Guid>());
    }

    [Fact]
    public async Task CreateTicket_KeyNotConfigured_ReturnsFailure()
    {
        _issuer.IsConfigured.Returns(false);

        var result = await new CreateBridgePairingTicketCommandHandler(_issuer, _currentUser)
            .Handle(new CreateBridgePairingTicketCommand(), default);

        Assert.Equal(400, result.StatusCode);
        Assert.Equal(ErrorMessages.FiscalBridge.PairingKeyNotConfigured, result.Error);
    }

    [Fact]
    public async Task GetKey_Admin_ReturnsPublicKey()
    {
        _issuer.GetPublicKeyPem().Returns("PEM");

        var result = await new GetBridgePairingKeyQueryHandler(_issuer, _currentUser)
            .Handle(new GetBridgePairingKeyQuery(), default);

        Assert.True(result.Value!.IsConfigured);
        Assert.Equal("PEM", result.Value.PublicKeyPem);
    }

    [Fact]
    public async Task GetKey_NotAdmin_ReturnsForbidden()
    {
        _currentUser.Role.Returns(Roles.Receptionist);

        var result = await new GetBridgePairingKeyQueryHandler(_issuer, _currentUser)
            .Handle(new GetBridgePairingKeyQuery(), default);

        Assert.Equal(403, result.StatusCode);
    }
}
