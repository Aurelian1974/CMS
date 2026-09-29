using ValyanClinic.FiscalBridge.Printing;
using ValyanClinic.FiscalBridge.Security;
using ValyanClinic.FiscalBridge.Services;

namespace ValyanClinic.FiscalBridge.Endpoints;

/// <summary>
/// API-ul local folosit de browserul recepției:
/// <list type="bullet">
/// <item><c>GET  /api/health</c> — fără token, doar „rulează";</item>
/// <item><c>POST /api/pair</c> — fără token, cu tichet de asociere semnat de server → token nou;</item>
/// <item><c>GET  /api/status</c> — starea casei de marcat;</item>
/// <item><c>POST /api/receipts</c> — tipărește (idempotent pe jobId);</item>
/// <item><c>GET  /api/receipts/{jobId}</c> — jurnalul local al unui bon (reconciliere);</item>
/// <item><c>POST /api/device/cancel-open-receipt</c> — anulează un bon rămas deschis pe aparat.</item>
/// </list>
/// </summary>
public static class BridgeEndpoints
{
    public static void MapBridgeEndpoints(this WebApplication app)
    {
        app.MapGet("/api/health", () => Results.Ok(new { status = "ok", version = typeof(BridgeEndpoints).Assembly.GetName().Version?.ToString() }));

        // Fără token: autorizarea e tichetul semnat de server, emis doar pentru administratori
        app.MapPost("/api/pair", (PairRequest request, PairingTicketVerifier verifier, ISecretStore secrets) =>
            verifier.Verify(request.Ticket) switch
            {
                PairingTicketStatus.Valid => Results.Ok(new { token = secrets.RotateToken() }),
                PairingTicketStatus.NotConfigured => Results.Json(
                    new { message = "Bridge-ul nu are configurată cheia publică de asociere (Bridge:PairingPublicKey în appsettings.json)." },
                    statusCode: StatusCodes.Status503ServiceUnavailable),
                PairingTicketStatus.Expired => Results.Json(
                    new { message = "Tichetul de asociere a expirat. Reîncercați." }, statusCode: StatusCodes.Status401Unauthorized),
                PairingTicketStatus.Replayed => Results.Conflict(new { message = "Tichetul de asociere a fost deja folosit." }),
                _ => Results.Json(
                    new { message = "Tichet de asociere invalid — cheia publică din bridge nu corespunde serverului." },
                    statusCode: StatusCodes.Status401Unauthorized),
            });

        var api = app.MapGroup("/api").AddEndpointFilter<BridgeTokenFilter>();

        api.MapGet("/status", async (ReceiptPrintService service, CancellationToken ct) =>
            Results.Ok(await service.GetStatusAsync(ct)));

        api.MapPost("/receipts", async (ReceiptJob job, ReceiptPrintService service, CancellationToken ct) =>
        {
            var attempt = await service.PrintAsync(job, ct);
            if (attempt.Result is not null) return Results.Ok(attempt.Result);
            return attempt.IsConflict
                ? Results.Conflict(new { message = attempt.RejectionReason })
                : Results.BadRequest(new { message = attempt.RejectionReason });
        });

        api.MapGet("/receipts/{jobId:guid}", (Guid jobId, ReceiptPrintService service) =>
            service.GetJob(jobId) is { } entry
                ? Results.Ok(entry)
                : Results.NotFound(new { message = "Bridge-ul nu a primit niciodată acest bon." }));

        api.MapPost("/device/cancel-open-receipt", async (ReceiptPrintService service, CancellationToken ct) =>
            Results.Ok(new { cancelled = await service.CancelOpenReceiptAsync(ct) }));
    }
}
