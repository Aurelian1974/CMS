namespace ValyanClinic.Application.Features.ConsultationServices.DTOs;

/// <summary>Investiga\u021bie efectuat\u0103 f\u0103r\u0103 linie de serviciu; ReasonCode: NO_SERVICE / SERVICE_INACTIVE / NO_PRICE / NOT_SYNCED.</summary>
public sealed class UnbilledInvestigationDto
{
    public Guid ConsultationInvestigationId { get; init; }
    public string InvestigationTypeCode { get; init; } = string.Empty;
    public string InvestigationName { get; init; } = string.Empty;
    public DateTime InvestigationDate { get; init; }
    public string? ServiceCode { get; init; }
    public string ReasonCode { get; init; } = string.Empty;
}
