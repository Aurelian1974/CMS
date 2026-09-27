namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardLockedUserDto
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public DateTime LockoutEnd { get; init; }
    public int FailedLoginAttempts { get; init; }
    public DateTime? LastLoginAt { get; init; }
}
