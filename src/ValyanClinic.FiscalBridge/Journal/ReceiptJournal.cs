using System.Text.Json;
using System.Text.Json.Serialization;

namespace ValyanClinic.FiscalBridge.Journal;

/// <summary>
/// Jurnal local, persistent, al bonurilor. Starea <see cref="JournalState.Printing"/> se scrie pe disc
/// ÎNAINTE de prima comandă către aparat, deci după o cădere a procesului știm că jobul trebuie
/// reconciliat și nu retipărit. Scrierea e atomică (fișier temporar + înlocuire).
/// </summary>
public sealed class ReceiptJournal
{
    private static readonly JsonSerializerOptions Json = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly string _directory;
    private readonly TimeProvider _time;

    public ReceiptJournal(string directory, TimeProvider time)
    {
        _directory = directory;
        _time = time;
        Directory.CreateDirectory(_directory);
    }

    public JournalEntry? Get(Guid jobId)
    {
        var path = PathFor(jobId);
        if (!File.Exists(path)) return null;
        return JsonSerializer.Deserialize<JournalEntry>(File.ReadAllText(path), Json);
    }

    public JournalEntry Save(Guid jobId, string payloadHash, JournalState state, Action<JournalUpdate>? update = null)
    {
        var now = _time.GetLocalNow().DateTime;
        var existing = Get(jobId);
        var changes = new JournalUpdate();
        update?.Invoke(changes);

        var entry = new JournalEntry
        {
            JobId = jobId,
            PayloadHash = payloadHash,
            State = state,
            Attempts = (existing?.Attempts ?? 0) + (state == JournalState.Printing ? 1 : 0),
            ReceiptNumber = changes.ReceiptNumber ?? existing?.ReceiptNumber,
            DeviceSerialNumber = changes.DeviceSerialNumber ?? existing?.DeviceSerialNumber,
            PrintedAt = changes.PrintedAt ?? existing?.PrintedAt,
            ErrorMessage = changes.ErrorMessage,
            DeviceResponse = changes.DeviceResponse ?? existing?.DeviceResponse,
            CreatedAt = existing?.CreatedAt ?? now,
            UpdatedAt = now,
            History = [.. existing?.History ?? [], new JournalEvent(now, state, changes.ErrorMessage)],
        };

        var path = PathFor(jobId);
        var temp = path + ".tmp";
        using (var stream = new FileStream(temp, FileMode.Create, FileAccess.Write, FileShare.None, 4096, FileOptions.WriteThrough))
        {
            JsonSerializer.Serialize(stream, entry, Json);
        }
        File.Move(temp, path, overwrite: true);
        return entry;
    }

    private string PathFor(Guid jobId) => Path.Combine(_directory, $"{jobId:N}.json");
}
