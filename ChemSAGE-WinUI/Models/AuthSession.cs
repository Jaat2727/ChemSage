using System.Text.Json.Serialization;

namespace ChemSAGE_WinUI.Models;

public sealed record AuthSession(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("refresh_token")] string RefreshToken,
    [property: JsonPropertyName("expires_in")] int ExpiresIn,
    [property: JsonPropertyName("token_type")] string TokenType,
    [property: JsonPropertyName("user")] SupabaseUser User);

public sealed record SupabaseUser(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("email")] string Email);
