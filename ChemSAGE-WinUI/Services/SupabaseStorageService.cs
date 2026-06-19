using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ChemSAGE_WinUI.Models;
using Microsoft.Extensions.Options;

namespace ChemSAGE_WinUI.Services;

public abstract class SupabaseStorageService(HttpClient httpClient, IOptions<SupabaseOptions> options)
{
    protected readonly HttpClient HttpClient = httpClient;
    protected readonly SupabaseOptions Options = options.Value;

    protected HttpRequestMessage CreateRestRequest(HttpMethod method, string path, string accessToken)
    {
        var request = new HttpRequestMessage(method, new Uri(Options.RestUri, path));
        AddSupabaseHeaders(request, accessToken);
        return request;
    }

    protected HttpRequestMessage CreateStorageRequest(HttpMethod method, string path, string accessToken)
    {
        var storageRoot = new Uri($"{Options.Url.TrimEnd('/')}/storage/v1/object/");
        var request = new HttpRequestMessage(method, new Uri(storageRoot, path));
        AddSupabaseHeaders(request, accessToken);
        return request;
    }

    protected string GetPublicStorageUrl(string bucket, string path) =>
        $"{Options.Url.TrimEnd('/')}/storage/v1/object/public/{bucket}/{Uri.EscapeDataString(path).Replace("%2F", "/")}";

    protected static string BuildStoragePath(Guid userId, string filePath)
    {
        var fileName = Path.GetFileName(filePath);
        var safeName = string.Join("_", fileName.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
        return $"{userId}/{DateTimeOffset.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}-{safeName}";
    }

    protected async Task UploadObjectAsync(string accessToken, string bucket, string storagePath, string filePath, string contentType, IProgress<double>? progress, CancellationToken cancellationToken)
    {
        progress?.Report(5);
        await using var stream = File.OpenRead(filePath);
        using var content = new StreamContent(stream);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        using var request = CreateStorageRequest(HttpMethod.Post, $"{bucket}/{storagePath}", accessToken);
        request.Content = content;
        request.Headers.Add("x-upsert", "true");
        using var response = await HttpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();
        progress?.Report(65);
    }

    protected async Task<StorageDownload> DownloadObjectAsync(string accessToken, string bucket, string storagePathOrUrl, IProgress<double>? progress, CancellationToken cancellationToken)
    {
        progress?.Report(10);
        var objectPath = ExtractStoragePath(bucket, storagePathOrUrl);
        using var request = CreateStorageRequest(HttpMethod.Get, $"{bucket}/{objectPath}", accessToken);
        using var response = await HttpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        progress?.Report(100);
        return new StorageDownload(Path.GetFileName(objectPath), response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream", bytes);
    }

    protected async Task<IReadOnlyList<T>> GetListAsync<T>(string accessToken, string path, CancellationToken cancellationToken)
    {
        using var request = CreateRestRequest(HttpMethod.Get, path, accessToken);
        using var response = await HttpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<IReadOnlyList<T>>(cancellationToken) ?? Array.Empty<T>();
    }

    protected async Task<T> InsertSingleAsync<T>(string accessToken, string table, object payload, CancellationToken cancellationToken)
    {
        using var request = CreateRestRequest(HttpMethod.Post, $"{table}?select=*", accessToken);
        request.Headers.Add("Prefer", "return=representation");
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var response = await HttpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        var rows = await response.Content.ReadFromJsonAsync<IReadOnlyList<T>>(cancellationToken);
        return rows?.FirstOrDefault() ?? throw new InvalidOperationException($"Supabase did not return an inserted {table} row.");
    }

    protected async Task IncrementDownloadCountAsync(string accessToken, string table, Guid id, CancellationToken cancellationToken)
    {
        using var request = CreateRestRequest(HttpMethod.Post, "rpc/increment_download_count", accessToken);
        request.Content = JsonContent.Create(new { p_table = table, p_id = id });
        using var response = await HttpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    protected static string Eq(string column, string? value) => string.IsNullOrWhiteSpace(value) ? string.Empty : $"&{column}=eq.{Uri.EscapeDataString(value)}";

    protected static string ILikeAny(params (string Column, string? Value)[] clauses)
    {
        var active = clauses.Where(c => !string.IsNullOrWhiteSpace(c.Value)).Select(c => $"{c.Column}.ilike.*{Uri.EscapeDataString(c.Value!)}*").ToArray();
        return active.Length == 0 ? string.Empty : $"&or=({string.Join(',', active)})";
    }

    private static string ExtractStoragePath(string bucket, string storagePathOrUrl)
    {
        var marker = $"/{bucket}/";
        var index = storagePathOrUrl.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        var path = index >= 0 ? storagePathOrUrl[(index + marker.Length)..] : storagePathOrUrl;
        return Uri.UnescapeDataString(path.TrimStart('/'));
    }

    private void AddSupabaseHeaders(HttpRequestMessage request, string accessToken)
    {
        request.Headers.Add("apikey", Options.AnonKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
    }
}
