using MediatR;
using ValyanClinic.Application.Common.Models;

namespace ValyanClinic.Application.Features.Clinics.Commands.CreateClinicAddress;

public sealed record CreateClinicAddressCommand(
    string AddressType,
    string Street,
    string City,
    string County,
    string? PostalCode,
    string Country,
    bool IsMain
) : IRequest<Result<Guid>>;
