using MediatR;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Departments.DTOs;

namespace ValyanClinic.Application.Features.Departments.Queries.GetDepartments;

public sealed class GetDepartmentsQueryHandler(
    IDepartmentRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetDepartmentsQuery, Result<IEnumerable<DepartmentDto>>>
{
    public async Task<Result<IEnumerable<DepartmentDto>>> Handle(
        GetDepartmentsQuery request, CancellationToken cancellationToken)
    {
        var departments = await repository.GetByClinicAsync(
            currentUser.ClinicId,
            request.IsActive,
            request.LocationId,
            cancellationToken);

        return Result<IEnumerable<DepartmentDto>>.Success(departments);
    }
}
