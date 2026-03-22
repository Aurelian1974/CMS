namespace ValyanClinic.Application.Common.Interfaces;

public interface ICnasNomenclatorService
{
    Task<Guid> StartSyncAsync(string triggeredBy, CancellationToken ct = default);
}
