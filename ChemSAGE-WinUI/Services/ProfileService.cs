using System.Net.Http.Json;
using ChemSAGE_WinUI.Contracts;
using ChemSAGE_WinUI.Models;
using Microsoft.Extensions.Options;

namespace ChemSAGE_WinUI.Services;

public sealed class ProfileService(HttpClient httpClient, IOptions<SupabaseOptions> options) : IProfileService
{
    private readonly SupabaseOptions _options = options.Value;

    public async Task<UserProfile?> GetCurrentProfileAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default)
    {
        var uri = new Uri(_options.RestUri, $"profiles?id=eq.{userId}&select=id,name,email,roll_no,role,status,created_at&limit=1");
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        request.Headers.Add("apikey", _options.AnonKey);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        var profiles = await response.Content.ReadFromJsonAsync<IReadOnlyList<UserProfile>>(cancellationToken);
        return profiles?.FirstOrDefault();
    }
}
