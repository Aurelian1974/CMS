using Microsoft.AspNetCore.Mvc;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Infrastructure.Authentication;
using ValyanClinic.Application.Features.Clinics.Commands.CreateClinicLocation;
using ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicLocation;
using ValyanClinic.Application.Features.Clinics.Commands.UpdateClinic;
using ValyanClinic.Application.Features.Clinics.Commands.SyncClinicCaenCodes;
using ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicLocation;
using ValyanClinic.Application.Features.Clinics.Commands.CreateClinicBankAccount;
using ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicBankAccount;
using ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicBankAccount;
using ValyanClinic.Application.Features.Clinics.Commands.CreateClinicAddress;
using ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicAddress;
using ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicAddress;
using ValyanClinic.Application.Features.Clinics.Commands.CreateClinicContact;
using ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicContact;
using ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicContact;
using ValyanClinic.Application.Features.Clinics.Commands.CreateClinicContactPerson;
using ValyanClinic.Application.Features.Clinics.Commands.UpdateClinicContactPerson;
using ValyanClinic.Application.Features.Clinics.Commands.DeleteClinicContactPerson;
using ValyanClinic.Application.Features.Clinics.Queries.GetClinicLocations;
using ValyanClinic.Application.Features.Clinics.Queries.GetCurrentClinic;

namespace ValyanClinic.API.Controllers;

/// <summary>
/// Controller pentru gestionarea clinicii curente (societate comercială) și a sub-entităților sale.
/// Toate endpoint-urile operează pe ClinicId-ul din JWT (ICurrentUser).
/// </summary>
public class ClinicsController : BaseApiController
{
    // ==================== CLINICA CURENTĂ ====================

    [HttpGet("current")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Read)]
    public async Task<IActionResult> GetCurrentClinic(CancellationToken ct)
    {
        var result = await Mediator.Send(new GetCurrentClinicQuery(), ct);
        return HandleResult(result);
    }

    [HttpPut("current")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> UpdateCurrentClinic(
        [FromBody] UpdateClinicCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("current/caen-codes")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> SyncCaenCodes(
        [FromBody] SyncClinicCaenCodesCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    // ==================== LOCAȚII ====================

    [HttpGet("current/locations")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Read)]
    public async Task<IActionResult> GetLocations(
        [FromQuery] bool? isActive, CancellationToken ct)
    {
        var result = await Mediator.Send(new GetClinicLocationsQuery(isActive), ct);
        return HandleResult(result);
    }

    [HttpPost("current/locations")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> CreateLocation(
        [FromBody] CreateClinicLocationCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("current/locations/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> UpdateLocation(
        Guid id, [FromBody] UpdateClinicLocationRequest request, CancellationToken ct)
    {
        var command = new UpdateClinicLocationCommand(
            id, request.Name, request.Address, request.City, request.County,
            request.PostalCode, request.PhoneNumber, request.Email, request.IsPrimary);

        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("current/locations/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Full)]
    public async Task<IActionResult> DeleteLocation(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteClinicLocationCommand(id), ct);
        return HandleResult(result);
    }

    // ==================== CONTURI BANCARE ====================

    [HttpPost("current/bank-accounts")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> CreateBankAccount(
        [FromBody] CreateClinicBankAccountCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("current/bank-accounts/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> UpdateBankAccount(
        Guid id, [FromBody] UpdateClinicBankAccountRequest request, CancellationToken ct)
    {
        var command = new UpdateClinicBankAccountCommand(
            id, request.BankName, request.Iban, request.Currency, request.IsMain, request.Notes);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("current/bank-accounts/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Full)]
    public async Task<IActionResult> DeleteBankAccount(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteClinicBankAccountCommand(id), ct);
        return HandleResult(result);
    }

    // ==================== ADRESE ====================

    [HttpPost("current/addresses")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> CreateAddress(
        [FromBody] CreateClinicAddressCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("current/addresses/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> UpdateAddress(
        Guid id, [FromBody] UpdateClinicAddressRequest request, CancellationToken ct)
    {
        var command = new UpdateClinicAddressCommand(
            id, request.AddressType, request.Street, request.City, request.County,
            request.PostalCode, request.Country, request.IsMain);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("current/addresses/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Full)]
    public async Task<IActionResult> DeleteAddress(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteClinicAddressCommand(id), ct);
        return HandleResult(result);
    }

    // ==================== DATE DE CONTACT ====================

    [HttpPost("current/contacts")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> CreateContact(
        [FromBody] CreateClinicContactCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("current/contacts/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> UpdateContact(
        Guid id, [FromBody] UpdateClinicContactRequest request, CancellationToken ct)
    {
        var command = new UpdateClinicContactCommand(
            id, request.ContactType, request.Value, request.Label, request.IsMain);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("current/contacts/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Full)]
    public async Task<IActionResult> DeleteContact(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteClinicContactCommand(id), ct);
        return HandleResult(result);
    }

    // ==================== PERSOANE DE CONTACT ====================

    [HttpPost("current/contact-persons")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> CreateContactPerson(
        [FromBody] CreateClinicContactPersonCommand command, CancellationToken ct)
    {
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPut("current/contact-persons/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Write)]
    public async Task<IActionResult> UpdateContactPerson(
        Guid id, [FromBody] UpdateClinicContactPersonRequest request, CancellationToken ct)
    {
        var command = new UpdateClinicContactPersonCommand(
            id, request.Name, request.Function, request.PhoneNumber, request.Email, request.IsMain);
        var result = await Mediator.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("current/contact-persons/{id:guid}")]
    [HasAccess(ModuleCodes.Clinic, AccessLevel.Full)]
    public async Task<IActionResult> DeleteContactPerson(Guid id, CancellationToken ct)
    {
        var result = await Mediator.Send(new DeleteClinicContactPersonCommand(id), ct);
        return HandleResult(result);
    }
}

// ===== Request models =====

public sealed record UpdateClinicLocationRequest(
    string Name, string Address, string City, string County,
    string? PostalCode, string? PhoneNumber, string? Email, bool IsPrimary);

public sealed record UpdateClinicBankAccountRequest(
    string BankName, string Iban, string Currency, bool IsMain, string? Notes);

public sealed record UpdateClinicAddressRequest(
    string AddressType, string Street, string City, string County,
    string? PostalCode, string Country, bool IsMain);

public sealed record UpdateClinicContactRequest(
    string ContactType, string Value, string? Label, bool IsMain);

public sealed record UpdateClinicContactPersonRequest(
    string Name, string? Function, string? PhoneNumber, string? Email, bool IsMain);

