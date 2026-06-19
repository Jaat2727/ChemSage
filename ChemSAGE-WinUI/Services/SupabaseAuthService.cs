using System.Net.Http.Json;
using System.Text.Json.Serialization;
using ChemSAGE_WinUI.Contracts;
using ChemSAGE_WinUI.Models;
using Microsoft.Extensions.Options;

namespace ChemSAGE_WinUI.Services;

public sealed class SupabaseAuthService(HttpClient httpClient, IOptions<SupabaseOptions> options, ISecureTokenStore tokenStore) : ISupabaseAuthService
{
    private readonly SupabaseOptions _options = options.Value;

    public Task<AuthSession?> RestoreSessionAsync(CancellationToken cancellationToken = default) => tokenStore.ReadAsync(cancellationToken);

    public async Task<AuthSession> SignInAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var session = await PostAuthAsync("token?grant_type=password", new { email, password }, cancellationToken);
        await tokenStore.SaveAsync(session, cancellationToken);
        return session;
    }

    public async Task<AuthSession> SignUpAsync(string email, string password, string fullName, CancellationToken cancellationToken = default)
    {
        await RequestWebSignupAsync(email, password, fullName, cancellationToken);
        return await SignInAsync(email, password, cancellationToken);
    }

    public async Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default)
    {
        using var request = CreateAuthRequest(HttpMethod.Post, "recover");
        request.Content = JsonContent.Create(new { email });
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public async Task SignOutAsync(CancellationToken cancellationToken = default)
    {
        await tokenStore.ClearAsync(cancellationToken);
    }

    private async Task RequestWebSignupAsync(string email, string password, string fullName, CancellationToken cancellationToken)
    {
        var rollNo = email.Split('@')[0].ToUpperInvariant();
        using var response = await httpClient.PostAsJsonAsync(new Uri(new Uri(_options.WebApiBaseUrl.TrimEnd('/') + "/"), "api/auth/signup"), new
        {
            email,
            password,
            name = fullName,
            rollNo,
            programme = InferProgramme(rollNo),
            batch_year = InferBatchYear(rollNo)
        }, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    private static string InferProgramme(string rollNo) => rollNo.Length >= 2 ? rollNo[..2] : "BS";

    private static int InferBatchYear(string rollNo) => rollNo.Length >= 4 && int.TryParse(rollNo.Substring(2, 2), out var year) ? 2000 + year : DateTimeOffset.UtcNow.Year;

    private async Task<AuthSession> PostAuthAsync(string path, object body, CancellationToken cancellationToken)
    {
        using var request = CreateAuthRequest(HttpMethod.Post, path);
        request.Content = JsonContent.Create(body);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AuthSession>(cancellationToken) ?? throw new InvalidOperationException("Supabase did not return an auth session.");
    }

    private HttpRequestMessage CreateAuthRequest(HttpMethod method, string path)
    {
        var request = new HttpRequestMessage(method, new Uri(_options.AuthUri, path));
        request.Headers.Add("apikey", _options.AnonKey);
        return request;
    }
}
