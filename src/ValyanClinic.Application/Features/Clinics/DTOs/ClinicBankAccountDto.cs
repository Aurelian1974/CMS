namespace ValyanClinic.Application.Features.Clinics.DTOs;

public sealed class ClinicBankAccountDto
{
    public Guid Id { get; set; }
    public Guid ClinicId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string Iban { get; set; } = string.Empty;
    public string Currency { get; set; } = "RON";
    public bool IsMain { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
