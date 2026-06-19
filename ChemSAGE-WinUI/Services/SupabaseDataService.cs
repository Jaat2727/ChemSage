using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ChemSAGE_WinUI.Contracts;
using ChemSAGE_WinUI.Models;
using Microsoft.Extensions.Options;

namespace ChemSAGE_WinUI.Services;

public sealed class SupabaseDataService(HttpClient httpClient, IOptions<SupabaseOptions> options) : ISupabaseDataService, IDatabaseFunctionService
{
    private readonly SupabaseOptions _options = options.Value;

    public Task<IReadOnlyList<AcademicResource>> GetResourcesAsync(string accessToken, CancellationToken cancellationToken = default) =>
        GetListAsync<AcademicResource>(accessToken, "resources?select=id,title,description,category,subject,file_url,download_count,status,created_at&status=eq.active&order=created_at.desc&limit=100", cancellationToken);

    public Task<IReadOnlyList<ExamPaper>> GetPastPapersAsync(string accessToken, CancellationToken cancellationToken = default) =>
        GetListAsync<ExamPaper>(accessToken, "exam_papers?select=id,title:subject,subject,year,semester,exam_type,file_url,download_count,status&status=eq.active&order=year.desc&limit=100", cancellationToken);

    public Task<IReadOnlyList<StudyCircle>> GetStudyCirclesAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default) =>
        GetListAsync<StudyCircle>(accessToken, "rooms?select=id,name,description,location,is_public,created_by&is_public=eq.true&id=neq.global&order=created_at.desc&limit=100", cancellationToken);

    public Task<IReadOnlyList<TaskItem>> GetTasksAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default) =>
        GetListAsync<TaskItem>(accessToken, $"tasks?select=id,title,description,status,priority,due_date&user_id=eq.{userId}&order=created_at.desc&limit=100", cancellationToken);

    public Task<IReadOnlyList<ScheduleItem>> GetScheduleAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default) =>
        GetListAsync<ScheduleItem>(accessToken, $"schedule?select=id,title:subject,start_time,end_time,location:room_no&order=start_time.asc&limit=100", cancellationToken);

    public Task<IReadOnlyList<NotificationItem>> GetNotificationsAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default) =>
        GetListAsync<NotificationItem>(accessToken, $"notifications?select=id,title,message,is_read,created_at&user_id=eq.{userId}&order=created_at.desc&limit=100", cancellationToken);

    public async Task<int> IncrementDownloadCountAsync(string accessToken, string tableName, Guid id, CancellationToken cancellationToken = default)
    {
        var result = await CallRpcAsync<int?>(accessToken, "increment_download_count", new { p_table = tableName, p_id = id }, cancellationToken);
        return result ?? 0;
    }

    public Task<AdminStats?> GetAdminStatsAsync(string accessToken, CancellationToken cancellationToken = default) =>
        CallRpcAsync<AdminStats>(accessToken, "get_admin_stats", new { }, cancellationToken);

    public async Task<IReadOnlyList<OrphanUser>> GetOrphanUsersAsync(string accessToken, CancellationToken cancellationToken = default) =>
        await CallRpcAsync<IReadOnlyList<OrphanUser>>(accessToken, "get_orphan_users", new { }, cancellationToken) ?? Array.Empty<OrphanUser>();

    public Task RepairUserAsync(string accessToken, Guid targetUserId, CancellationToken cancellationToken = default) =>
        CallRpcNoContentAsync(accessToken, "repair_user", new { target_user_id = targetUserId }, cancellationToken);

    public Task UpdateUserStatusAsync(string accessToken, Guid targetUserId, string status, CancellationToken cancellationToken = default) =>
        CallRpcNoContentAsync(accessToken, "admin_update_user_status", new { target_user_id = targetUserId, new_status = status }, cancellationToken);

    public Task UpdateUserRoleAsync(string accessToken, Guid targetUserId, string role, CancellationToken cancellationToken = default) =>
        CallRpcNoContentAsync(accessToken, "admin_update_user_role", new { target_user_id = targetUserId, new_role = role }, cancellationToken);

    public Task<ProfileAnalytics?> GetProfileAnalyticsAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default) =>
        CallRpcAsync<ProfileAnalytics>(accessToken, "get_profile_analytics", new { p_user_id = userId }, cancellationToken);

    private async Task<IReadOnlyList<T>> GetListAsync<T>(string accessToken, string path, CancellationToken cancellationToken)
    {
        using var request = CreateRestRequest(HttpMethod.Get, path, accessToken);
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<IReadOnlyList<T>>(cancellationToken) ?? Array.Empty<T>();
    }

    private async Task<T?> CallRpcAsync<T>(string accessToken, string functionName, object payload, CancellationToken cancellationToken)
    {
        using var request = CreateRestRequest(HttpMethod.Post, $"rpc/{functionName}", accessToken);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<T>(cancellationToken);
    }

    private async Task CallRpcNoContentAsync(string accessToken, string functionName, object payload, CancellationToken cancellationToken)
    {
        using var request = CreateRestRequest(HttpMethod.Post, $"rpc/{functionName}", accessToken);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    private HttpRequestMessage CreateRestRequest(HttpMethod method, string path, string accessToken)
    {
        var request = new HttpRequestMessage(method, new Uri(_options.RestUri, path));
        request.Headers.Add("apikey", _options.AnonKey);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        return request;
    }
}
