using System.Text.Json.Serialization;

namespace ChemSAGE_WinUI.Models;

public sealed record UserProfile(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("name")] string? FullName,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("roll_no")] string? RollNumber,
    [property: JsonPropertyName("role")] string? Role,
    [property: JsonPropertyName("status")] string? Status,
    [property: JsonPropertyName("created_at")] DateTimeOffset? CreatedAt);
