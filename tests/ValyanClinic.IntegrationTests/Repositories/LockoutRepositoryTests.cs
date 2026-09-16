using Dapper;
using Microsoft.Data.SqlClient;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.IntegrationTests.Fixtures;

namespace ValyanClinic.IntegrationTests.Repositories;

/// <summary>
/// Teste pentru comportamentul de blocare a contului, la nivelul SP-ului
/// User_IncrementFailedLogin.
///
/// Logica sta in SQL, deci nu poate fi acoperita de teste unitare. Regresia pe care
/// o pazesc: FailedLoginAttempts se reseta doar la login reusit, asa ca dupa
/// expirarea blocarii contorul ramanea la prag si o singura greseala de tastare
/// reblocha contul instantaneu, la nesfarsit.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class LockoutRepositoryTests(IntegrationTestFixture fixture)
    : IntegrationTestBase(fixture), IAsyncLifetime
{
    private const int MaxAttempts    = 5;
    private const int LockoutMinutes = 15;

    private IAuthRepository AuthRepo => Fixture.GetRepository<IAuthRepository>();

    /// <summary>
    /// Randurile create de aceasta clasa, sterse la final.
    ///
    /// Curatarea e explicita, nu prin Respawn: ResetDatabaseAsync() exista in fixture
    /// dar nu e apelat de niciun test, iar lista lui de tabele include Users, Patients
    /// si Doctors — invocarea lui pe o baza de date de dezvoltare ar sterge date reale.
    /// </summary>
    private readonly List<(Guid UserId, Guid StaffId)> _created = [];

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        if (_created.Count == 0) return;

        await using var conn = new SqlConnection(Fixture.ConnectionString);
        foreach (var (userId, staffId) in _created)
        {
            await conn.ExecuteAsync(
                "DELETE FROM Users WHERE Id = @userId; DELETE FROM MedicalStaff WHERE Id = @staffId;",
                new { userId, staffId });
        }
    }

    /// <summary>
    /// Creeaza un utilizator de test cu personalul medical asociat — constrangerea
    /// CK_Users_DoctorOrStaff cere exact unul dintre Doctor si MedicalStaff.
    /// Ambele tabele sunt curatate de Respawn intre teste.
    /// </summary>
    private async Task<Guid> CreateTestUserAsync(int failedAttempts, DateTime? lockoutEnd)
    {
        var suffix   = Guid.NewGuid().ToString("N")[..8];
        var staffId  = Guid.NewGuid();
        var userId   = Guid.NewGuid();

        await using var conn = new SqlConnection(Fixture.ConnectionString);

        await conn.ExecuteAsync(
            """
            INSERT INTO MedicalStaff (Id, ClinicId, FirstName, LastName, Email, CreatedBy)
            VALUES (@StaffId, @ClinicId, N'Test', N'Lockout', @Email, @ClinicId);

            INSERT INTO Users (Id, ClinicId, RoleId, MedicalStaffId, Username, Email,
                               PasswordHash, FirstName, LastName, IsActive,
                               FailedLoginAttempts, LockoutEnd)
            SELECT @UserId, @ClinicId, (SELECT TOP 1 Id FROM Roles WHERE Code = 'nurse'),
                   @StaffId, @Username, @Email, N'not-a-real-hash', N'Test', N'Lockout', 1,
                   @FailedAttempts, @LockoutEnd;
            """,
            new
            {
                StaffId  = staffId,
                UserId   = userId,
                ClinicId = Fixture.TestClinicId,
                Email    = $"{TestPrefix}lockout_{suffix}@valyan.test",
                Username = $"{TestPrefix}lockout_{suffix}",
                FailedAttempts = failedAttempts,
                LockoutEnd = lockoutEnd,
            });

        _created.Add((userId, staffId));
        return userId;
    }

    private async Task<(int Attempts, DateTime? LockoutEnd)> ReadStateAsync(Guid userId)
    {
        await using var conn = new SqlConnection(Fixture.ConnectionString);
        return await conn.QuerySingleAsync<(int, DateTime?)>(
            "SELECT FailedLoginAttempts, LockoutEnd FROM Users WHERE Id = @userId",
            new { userId });
    }

    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Increment_BelowThreshold_RaisesCounterWithoutLocking()
    {
        var userId = await CreateTestUserAsync(failedAttempts: 0, lockoutEnd: null);

        await AuthRepo.IncrementFailedLoginAsync(userId, MaxAttempts, LockoutMinutes, default);

        var (attempts, lockoutEnd) = await ReadStateAsync(userId);
        Assert.Equal(1, attempts);
        Assert.Null(lockoutEnd);
    }

    [Fact]
    public async Task Increment_ReachingThreshold_LocksAccount()
    {
        var userId = await CreateTestUserAsync(failedAttempts: MaxAttempts - 1, lockoutEnd: null);

        await AuthRepo.IncrementFailedLoginAsync(userId, MaxAttempts, LockoutMinutes, default);

        var (attempts, lockoutEnd) = await ReadStateAsync(userId);
        Assert.Equal(MaxAttempts, attempts);
        Assert.NotNull(lockoutEnd);
        Assert.True(lockoutEnd > DateTime.Now, "contul ar trebui blocat in viitor");
    }

    [Fact]
    public async Task Increment_AfterLockoutExpired_RestartsCounter_AndDoesNotRelock()
    {
        // Regresia propriu-zisa: contor la prag, blocare deja expirata.
        var userId = await CreateTestUserAsync(
            failedAttempts: MaxAttempts,
            lockoutEnd: DateTime.Now.AddMinutes(-1));

        await AuthRepo.IncrementFailedLoginAsync(userId, MaxAttempts, LockoutMinutes, default);

        var (attempts, lockoutEnd) = await ReadStateAsync(userId);
        Assert.Equal(1, attempts);
        Assert.True(
            lockoutEnd is null || lockoutEnd <= DateTime.Now,
            "o singura greseala dupa deblocare nu trebuie sa reblocheze contul");
    }

    [Fact]
    public async Task Increment_AfterLockoutExpired_ClearsStaleLockout()
    {
        var userId = await CreateTestUserAsync(
            failedAttempts: 2,
            lockoutEnd: DateTime.Now.AddMinutes(-30));

        await AuthRepo.IncrementFailedLoginAsync(userId, MaxAttempts, LockoutMinutes, default);

        var (attempts, lockoutEnd) = await ReadStateAsync(userId);
        Assert.Equal(1, attempts);
        Assert.Null(lockoutEnd);
    }

    [Fact]
    public async Task Increment_WhileLockoutActive_KeepsAccountLocked()
    {
        var activeLockout = DateTime.Now.AddMinutes(10);
        var userId = await CreateTestUserAsync(failedAttempts: MaxAttempts, lockoutEnd: activeLockout);

        await AuthRepo.IncrementFailedLoginAsync(userId, MaxAttempts, LockoutMinutes, default);

        var (_, lockoutEnd) = await ReadStateAsync(userId);
        Assert.NotNull(lockoutEnd);
        Assert.True(lockoutEnd > DateTime.Now, "blocarea activa trebuie sa ramana in vigoare");
    }

    [Fact]
    public async Task ResetFailedLogin_ClearsCounterAndLockout()
    {
        var userId = await CreateTestUserAsync(
            failedAttempts: MaxAttempts,
            lockoutEnd: DateTime.Now.AddMinutes(10));

        await AuthRepo.ResetFailedLoginAsync(userId, default);

        var (attempts, lockoutEnd) = await ReadStateAsync(userId);
        Assert.Equal(0, attempts);
        Assert.Null(lockoutEnd);
    }
}
