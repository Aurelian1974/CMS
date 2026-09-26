namespace ValyanClinic.Application.Common.Interfaces;

public sealed record SipeTransmissionResult(
    bool IsSuccess,
    string? ElectronicId,
    bool IsOffline,
    string? ErrorMessage);
