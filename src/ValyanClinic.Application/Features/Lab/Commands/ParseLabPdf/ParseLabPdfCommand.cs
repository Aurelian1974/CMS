using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Lab.DTOs;

namespace ValyanClinic.Application.Features.Lab.Commands.ParseLabPdf;

/// <summary>Parsează un PDF de buletin de analize și returnează datele structurate (fără salvare).</summary>
public sealed record ParseLabPdfCommand(Stream PdfStream, string FileName) : IRequest<Result<LabParseResultDto>>;

public sealed class ParseLabPdfCommandHandler(ILabPdfParser parser)
    : IRequestHandler<ParseLabPdfCommand, Result<LabParseResultDto>>
{
    public async Task<Result<LabParseResultDto>> Handle(ParseLabPdfCommand request, CancellationToken ct)
    {
        try
        {
            var result = await parser.ParseAsync(request.PdfStream, request.FileName, ct);
            return Result<LabParseResultDto>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<LabParseResultDto>.Failure($"Eroare la parsarea PDF: {ex.Message}");
        }
    }
}
