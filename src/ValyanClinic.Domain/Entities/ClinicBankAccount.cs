namespace ValyanClinic.Domain.Entities;

public sealed class ClinicBankAccount
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public string BankName { get; set; } = string.Empty;
    public string Iban { get; set; } = string.Empty;
    public string Currency { get; set; } = "RON";
    public bool IsMain { get; set; }
    public string? Notes { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; set; }
}
