using ValyanClinic.Application.Common.Models;
using Xunit;

namespace ValyanClinic.Tests.Domain;

/// <summary>
/// Teste unitare pentru Result{T} — wrapper rezultat operații.
/// Verifică că factory methods populează corect proprietățile și codurile HTTP.
/// </summary>
public sealed class ResultTests
{
    // ── Success (200) ─────────────────────────────────────────────────────

    [Fact]
    public void Success_ShouldReturnIsSuccessTrue_WithStatusCode200()
    {
        var result = Result<string>.Success("test-value");

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
        Assert.Equal("test-value", result.Value);
        Assert.Null(result.Error);
    }

    [Fact]
    public void Success_WithComplexType_ShouldReturnValue()
    {
        var dto = new { Id = Guid.NewGuid(), Name = "Test" };
        var result = Result<object>.Success(dto);

        Assert.True(result.IsSuccess);
        Assert.Equal(dto, result.Value);
    }

    // ── Created (201) ─────────────────────────────────────────────────────

    [Fact]
    public void Created_ShouldReturnIsSuccessTrue_WithStatusCode201()
    {
        var newId = Guid.NewGuid();
        var result = Result<Guid>.Created(newId);

        Assert.True(result.IsSuccess);
        Assert.Equal(201, result.StatusCode);
        Assert.Equal(newId, result.Value);
        Assert.Null(result.Error);
    }

    // ── Failure (400) ─────────────────────────────────────────────────────

    [Fact]
    public void Failure_ShouldReturnIsSuccessFalse_WithStatusCode400()
    {
        var result = Result<string>.Failure("Eroare validare");

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
        Assert.Equal("Eroare validare", result.Error);
        Assert.Null(result.Value);
    }

    [Fact]
    public void Failure_WithCustomStatusCode_ShouldUseProvidedCode()
    {
        var result = Result<string>.Failure("Eroare", 422);

        Assert.False(result.IsSuccess);
        Assert.Equal(422, result.StatusCode);
    }

    // ── NotFound (404) ────────────────────────────────────────────────────

    [Fact]
    public void NotFound_ShouldReturnIsSuccessFalse_WithStatusCode404()
    {
        var result = Result<string>.NotFound("Resursa nu a fost găsită");

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
        Assert.Equal("Resursa nu a fost găsită", result.Error);
        Assert.Null(result.Value);
    }

    // ── Conflict (409) ────────────────────────────────────────────────────

    [Fact]
    public void Conflict_ShouldReturnIsSuccessFalse_WithStatusCode409()
    {
        var result = Result<string>.Conflict("Resursa există deja");

        Assert.False(result.IsSuccess);
        Assert.Equal(409, result.StatusCode);
        Assert.Equal("Resursa există deja", result.Error);
        Assert.Null(result.Value);
    }

    // ── Unauthorized (401) ────────────────────────────────────────────────

    [Fact]
    public void Unauthorized_ShouldReturnIsSuccessFalse_WithStatusCode401()
    {
        var result = Result<string>.Unauthorized("Credențiale invalide");

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
        Assert.Equal("Credențiale invalide", result.Error);
        Assert.Null(result.Value);
    }

    // ── Tip generic ───────────────────────────────────────────────────────

    [Fact]
    public void Result_WithGuidType_ShouldWorkCorrectly()
    {
        var id = Guid.NewGuid();
        var result = Result<Guid>.Success(id);

        Assert.True(result.IsSuccess);
        Assert.Equal(id, result.Value);
    }

    [Fact]
    public void Result_WithNullableType_ShouldWorkCorrectly()
    {
        var result = Result<string?>.Success(null);

        Assert.True(result.IsSuccess);
        Assert.Null(result.Value);
        Assert.Equal(200, result.StatusCode);
    }
}
