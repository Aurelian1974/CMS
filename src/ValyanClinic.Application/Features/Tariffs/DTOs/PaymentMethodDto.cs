namespace ValyanClinic.Application.Features.Tariffs.DTOs;

public sealed class PaymentMethodDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool RequiresFiscalReceipt { get; init; }
    public int SortOrder { get; init; }
}
