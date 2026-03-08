namespace ValyanClinic.Application.Features.Clinics.DTOs;

public sealed class ClinicBankAccountDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public string BankName { get; init; } = string.Empty;
    public string Iban { get; init; } = string.Empty;
    public string Currency { get; init; } = "RON";
    public bool IsMain { get; init; }
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}
