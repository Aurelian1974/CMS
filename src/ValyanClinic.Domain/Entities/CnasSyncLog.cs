namespace ValyanClinic.Domain.Entities;

public sealed class CnasSyncLog
{
    public Guid Id { get; init; }
    public DateTime StartedAt { get; init; }
    public DateTime? FinishedAt { get; set; }
    public string? NomenclatorVersion { get; set; }
    public string? UrlNomenclator { get; set; }
    public string? UrlLista { get; set; }
    public string Status { get; set; } = "Running";
    public string? ErrorMessage { get; set; }
    public int? DrugsInserted { get; set; }
    public int? DrugsUpdated { get; set; }
    public int? CompensatedInserted { get; set; }
    public int? CompensatedUpdated { get; set; }
    public int? ActiveSubstsInserted { get; set; }
    public int? DurationSeconds { get; set; }
    public string? TriggeredBy { get; set; }
}
