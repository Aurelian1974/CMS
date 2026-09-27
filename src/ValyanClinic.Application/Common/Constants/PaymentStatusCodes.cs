namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// Statusul de plată al unei consultații, calculat la citire din total vs. încasat.
/// </summary>
public static class PaymentStatusCodes
{
    public const string Unpaid  = "NEPLATIT";
    public const string Partial = "PARTIAL";
    public const string Paid    = "PLATIT";
}
