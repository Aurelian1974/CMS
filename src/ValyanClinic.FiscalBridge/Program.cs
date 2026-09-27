using System.Net;
using System.Text;
using System.Text.Json.Serialization;
using ValyanClinic.FiscalBridge.Configuration;
using ValyanClinic.FiscalBridge.Endpoints;
using ValyanClinic.FiscalBridge.Journal;
using ValyanClinic.FiscalBridge.Security;
using ValyanClinic.FiscalBridge.Services;

// Codificările Windows (CP1250 pentru diacritice) nu sunt încărcate implicit în .NET
Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

if (!OperatingSystem.IsWindows())
{
    Console.Error.WriteLine("Fiscal bridge rulează doar pe Windows (DPAPI, porturi COM).");
    return 1;
}

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
});

builder.Host.UseWindowsService(o => o.ServiceName = "ValyanClinic Fiscal Bridge");

builder.Services.Configure<BridgeOptions>(builder.Configuration.GetSection(BridgeOptions.SectionName));
builder.Services.Configure<PrinterOptions>(builder.Configuration.GetSection(PrinterOptions.SectionName));

var bridgeOptions = builder.Configuration.GetSection(BridgeOptions.SectionName).Get<BridgeOptions>() ?? new BridgeOptions();
var dataDirectory = bridgeOptions.ResolveDataDirectory();
var secrets = new DpapiSecretStore(dataDirectory);

// ── Comenzi de administrare (rulate o dată, de pe contul de administrator al PC-ului) ──
if (args.Contains("--show-token"))
{
    Console.WriteLine(secrets.GetOrCreateToken());
    return 0;
}
if (args.Contains("--rotate-token"))
{
    Console.WriteLine(secrets.RotateToken());
    Console.WriteLine("Token nou generat. Asociați din nou stația în ValyanClinic → Setări financiare.");
    return 0;
}
if (args.Contains("--set-operator-password"))
{
    // Citită de la tastatură, nu din argumente — nu rămâne în istoricul shell-ului
    Console.Write("Parola operatorului casei de marcat: ");
    var password = Console.ReadLine() ?? string.Empty;
    secrets.SetOperatorPassword(password.Trim());
    Console.WriteLine("Parola a fost salvată criptat (DPAPI).");
    return 0;
}

// Ascultă DOAR pe loopback — bridge-ul nu e accesibil din rețea
builder.WebHost.ConfigureKestrel(k => k.Listen(IPAddress.Loopback, bridgeOptions.Port));

builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(bridgeOptions.AllowedOrigins)
    .WithMethods("GET", "POST")
    .WithHeaders("Content-Type", BridgeTokenFilter.HeaderName)));

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<ISecretStore>(secrets);
builder.Services.AddSingleton(sp => new ReceiptJournal(Path.Combine(dataDirectory, "journal"), sp.GetRequiredService<TimeProvider>()));
builder.Services.AddSingleton(FiscalPrinterFactory.Create);
builder.Services.AddSingleton<ReceiptPrintService>();

var app = builder.Build();

// Token-ul se generează la primul start, ca să poată fi citit cu --show-token
secrets.GetOrCreateToken();

app.UseMiddleware<PrivateNetworkAccessMiddleware>();
app.UseCors();
app.MapBridgeEndpoints();

app.Run();
return 0;
