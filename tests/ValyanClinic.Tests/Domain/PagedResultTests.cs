using ValyanClinic.Application.Common.Models;
using Xunit;

namespace ValyanClinic.Tests.Domain;

/// <summary>
/// Teste unitare pentru PagedResult{T} — wrapper pentru rezultate paginate.
/// Verifică calculul TotalPages, HasPreviousPage, HasNextPage și corectitudinea Items.
/// </summary>
public sealed class PagedResultTests
{
    // ── Costructor și Items ───────────────────────────────────────────────

    [Fact]
    public void Constructor_ShouldStoreItemsCorrectly()
    {
        var items = new[] { "a", "b", "c" };
        var result = new PagedResult<string>(items, totalCount: 3, page: 1, pageSize: 10);

        Assert.Equal(3, result.Items.Count);
        Assert.Equal("a", result.Items[0]);
        Assert.Equal("c", result.Items[2]);
    }

    [Fact]
    public void Constructor_WithEmptyItems_ShouldReturnEmptyList()
    {
        var result = new PagedResult<int>([], totalCount: 0, page: 1, pageSize: 10);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
    }

    // ── TotalPages ────────────────────────────────────────────────────────

    [Theory]
    [InlineData(10, 10, 1)]    // exact fit — 1 pagină
    [InlineData(11, 10, 2)]    // overflow cu 1 — 2 pagini
    [InlineData(0, 10, 0)]     // 0 items — 0 pagini
    [InlineData(1, 10, 1)]     // 1 item — 1 pagină
    [InlineData(100, 10, 10)]  // exact 10 pagini
    [InlineData(101, 10, 11)]  // 10 pagini + 1 item în pagina 11
    [InlineData(25, 10, 3)]    // 2.5 → ceil → 3
    public void TotalPages_ShouldBeCalculatedCorrectly(
        int totalCount, int pageSize, int expectedTotalPages)
    {
        var result = new PagedResult<int>([], totalCount, page: 1, pageSize);
        Assert.Equal(expectedTotalPages, result.TotalPages);
    }

    // ── HasPreviousPage ───────────────────────────────────────────────────

    [Fact]
    public void HasPreviousPage_WhenOnFirstPage_ShouldBeFalse()
    {
        var result = new PagedResult<int>([], totalCount: 50, page: 1, pageSize: 10);
        Assert.False(result.HasPreviousPage);
    }

    [Fact]
    public void HasPreviousPage_WhenOnSecondPage_ShouldBeTrue()
    {
        var result = new PagedResult<int>([], totalCount: 50, page: 2, pageSize: 10);
        Assert.True(result.HasPreviousPage);
    }

    [Fact]
    public void HasPreviousPage_WhenOnLastPage_ShouldBeTrue()
    {
        var result = new PagedResult<int>([], totalCount: 50, page: 5, pageSize: 10);
        Assert.True(result.HasPreviousPage);
    }

    // ── HasNextPage ───────────────────────────────────────────────────────

    [Fact]
    public void HasNextPage_WhenOnLastPage_ShouldBeFalse()
    {
        var result = new PagedResult<int>([], totalCount: 50, page: 5, pageSize: 10);
        Assert.False(result.HasNextPage);
    }

    [Fact]
    public void HasNextPage_WhenNotOnLastPage_ShouldBeTrue()
    {
        var result = new PagedResult<int>([], totalCount: 50, page: 1, pageSize: 10);
        Assert.True(result.HasNextPage);
    }

    [Fact]
    public void HasNextPage_WhenOnSecondToLastPage_ShouldBeTrue()
    {
        var result = new PagedResult<int>([], totalCount: 50, page: 4, pageSize: 10);
        Assert.True(result.HasNextPage);
    }

    // ── Proprietăți stocate ───────────────────────────────────────────────

    [Fact]
    public void Properties_ShouldMatchConstructorArguments()
    {
        var items = Enumerable.Range(1, 5).ToList();
        var result = new PagedResult<int>(items, totalCount: 100, page: 3, pageSize: 5);

        Assert.Equal(100, result.TotalCount);
        Assert.Equal(3, result.Page);
        Assert.Equal(5, result.PageSize);
    }

    // ── Edge cases ────────────────────────────────────────────────────────

    [Fact]
    public void SinglePage_ShouldHaveNoPreviousAndNoNext()
    {
        var result = new PagedResult<string>(["a", "b"], totalCount: 2, page: 1, pageSize: 10);

        Assert.Equal(1, result.TotalPages);
        Assert.False(result.HasPreviousPage);
        Assert.False(result.HasNextPage);
    }

    [Fact]
    public void Items_ShouldBeReadOnly()
    {
        var items = new List<string> { "x", "y" };
        var result = new PagedResult<string>(items, totalCount: 2, page: 1, pageSize: 10);

        // Modificarea listei originale nu afectează Items (copiat la construcție)
        items.Add("z");
        Assert.Equal(2, result.Items.Count);
    }
}
