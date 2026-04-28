using ValyanClinic.Application.Features.Lab.DTOs;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>Parsează un buletin de analize PDF și returnează datele structurate.</summary>
public interface ILabPdfParser
{
    Task<LabParseResultDto> ParseAsync(Stream pdfStream, string fileName, CancellationToken ct);
}
