namespace ValyanClinic.Application.Features.FinancialSettings.DTOs;

public sealed class BridgePairingTicketDto
{
    public string Ticket { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
}
