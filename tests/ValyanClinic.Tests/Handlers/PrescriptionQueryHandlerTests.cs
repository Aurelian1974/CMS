using NSubstitute;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Prescriptions.DTOs;
using ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionById;
using ValyanClinic.Application.Features.Prescriptions.Queries.GetPrescriptionPdf;
using Xunit;

namespace ValyanClinic.Tests.Handlers;

public sealed class PrescriptionQueryHandlerTests
{
    private static readonly Guid ClinicId       = Guid.Parse("A7000005-0000-0000-0000-000000000001");
    private static readonly Guid PrescriptionId = Guid.Parse("C7000005-0000-0000-0000-000000000001");

    private readonly IPrescriptionRepository   _repo        = Substitute.For<IPrescriptionRepository>();
    private readonly IPrescriptionPdfGenerator _pdf         = Substitute.For<IPrescriptionPdfGenerator>();
    private readonly ICurrentUser              _currentUser = Substitute.For<ICurrentUser>();

    public PrescriptionQueryHandlerTests()
    {
        _currentUser.ClinicId.Returns(ClinicId);
    }

    [Fact]
    public async Task GetById_Exists_ReturnsSuccess()
    {
        var dto = new PrescriptionDetailDto { Id = PrescriptionId };
        _repo.GetByIdAsync(PrescriptionId, ClinicId, Arg.Any<CancellationToken>()).Returns(dto);

        var result = await new GetPrescriptionByIdQueryHandler(_repo, _currentUser)
            .Handle(new GetPrescriptionByIdQuery(PrescriptionId), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(dto, result.Value);
    }

    [Fact]
    public async Task GetById_Missing_ReturnsNotFound()
    {
        _repo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns((PrescriptionDetailDto?)null);

        var result = await new GetPrescriptionByIdQueryHandler(_repo, _currentUser)
            .Handle(new GetPrescriptionByIdQuery(PrescriptionId), default);

        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task GetPdf_IssuedPrescription_FileNameUsesSeriesAndNumberOnly()
    {
        var dto = new PrescriptionDetailDto
        {
            Id = PrescriptionId, Series = "RS", Number = 12, PatientName = "Popescu Ion", PatientCnp = "1800101123456",
        };
        _repo.GetByIdAsync(PrescriptionId, ClinicId, Arg.Any<CancellationToken>()).Returns(dto);
        _pdf.Generate(dto).Returns([1, 2, 3]);

        var result = await new GetPrescriptionPdfQueryHandler(_repo, _pdf, _currentUser)
            .Handle(new GetPrescriptionPdfQuery(PrescriptionId), default);

        Assert.True(result.IsSuccess);
        Assert.Equal("reteta_RS12.pdf", result.Value!.FileName);
        Assert.Equal([1, 2, 3], result.Value.Content);
    }

    [Fact]
    public async Task GetPdf_Missing_ReturnsNotFound()
    {
        _repo.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
             .Returns((PrescriptionDetailDto?)null);

        var result = await new GetPrescriptionPdfQueryHandler(_repo, _pdf, _currentUser)
            .Handle(new GetPrescriptionPdfQuery(PrescriptionId), default);

        Assert.Equal(404, result.StatusCode);
        _pdf.DidNotReceiveWithAnyArgs().Generate(default!);
    }
}
