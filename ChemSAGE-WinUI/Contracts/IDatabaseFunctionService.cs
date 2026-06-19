using ChemSAGE_WinUI.Models;

namespace ChemSAGE_WinUI.Contracts;

public interface IDatabaseFunctionService
{
    Task<AdminStats?> GetAdminStatsAsync(string accessToken, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OrphanUser>> GetOrphanUsersAsync(string accessToken, CancellationToken cancellationToken = default);
    Task RepairUserAsync(string accessToken, Guid targetUserId, CancellationToken cancellationToken = default);
    Task UpdateUserStatusAsync(string accessToken, Guid targetUserId, string status, CancellationToken cancellationToken = default);
    Task UpdateUserRoleAsync(string accessToken, Guid targetUserId, string role, CancellationToken cancellationToken = default);
    Task<ProfileAnalytics?> GetProfileAnalyticsAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default);
}
