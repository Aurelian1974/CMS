namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// Codurile statusurilor bonului fiscal (FiscalReceiptStatuses.Code, seed 0056).
/// </summary>
public static class FiscalReceiptStatusCodes
{
    public const string Pending   = "PENDING";
    public const string Printing  = "PRINTING";
    public const string Printed   = "PRINTED";
    public const string Failed    = "FAILED";
    public const string Unknown   = "UNKNOWN";
    public const string Cancelled = "CANCELLED";
}
