namespace ValyanClinic.Domain.Entities;

/// <summary>
/// Înregistrare în jurnalul de audit — cine, când, ce entitate, ce acțiune și valorile before/after.
/// Utilizat pentru conformitate medicală și GDPR.
/// </summary>
public sealed class AuditLog
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }

    /// <summary>Tipul entității auditate: 'Patient', 'User', 'Doctor', 'Appointment' etc.</summary>
    public string EntityType { get; init; } = default!;

    /// <summary>Id-ul entității modificate.</summary>
    public Guid EntityId { get; init; }

    /// <summary>Acțiunea efectuată: 'Create', 'Update', 'Delete'.</summary>
    public string Action { get; init; } = default!;

    /// <summary>Valorile înainte de modificare, serializate ca JSON. NULL pentru Create.</summary>
    public string? OldValues { get; init; }

    /// <summary>Valorile după modificare, serializate ca JSON. NULL pentru Delete.</summary>
    public string? NewValues { get; init; }

    /// <summary>Id-ul utilizatorului care a efectuat modificarea.</summary>
    public Guid ChangedBy { get; init; }

    /// <summary>Numele complet al utilizatorului (join la Users).</summary>
    public string? ChangedByName { get; init; }

    public DateTime ChangedAt { get; init; }
}
