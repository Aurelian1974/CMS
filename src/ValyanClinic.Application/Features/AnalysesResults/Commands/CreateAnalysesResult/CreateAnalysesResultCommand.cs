using System.Text.Json;
using MediatR;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.AnalysesResults.DTOs;

namespace ValyanClinic.Application.Features.AnalysesResults.Commands.CreateAnalysesResult;

public sealed record CreateAnalysesResultCommand(
    Guid    PatientId,
    Guid?   ConsultationId,
    string? Laboratory,
    string? BulletinNumber,
    DateOnly CollectionDate,
    DateOnly? ResultDate,
    string? DoctorName,
    IReadOnlyList<AnalysesResultDetailInput> Details)
    : IRequest<Result<Guid>>;

public sealed record AnalysesResultDetailInput(
    string  Section,
    string  TestName,
    string  Value,
    string? Unit,
    string? ReferenceRange,
    decimal? RefMin,
    decimal? RefMax,
    string? Flag,
    string? Method,
    string? Notes,
    string? Category,
    string? Subcategory);
