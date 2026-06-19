using ChemSAGE_WinUI.Models;

namespace ChemSAGE_WinUI.Contracts;

public interface ISupabaseDataService
{
    Task<IReadOnlyList<AcademicResource>> GetResourcesAsync(string accessToken, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ExamPaper>> GetPastPapersAsync(string accessToken, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StudyCircle>> GetStudyCirclesAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TaskItem>> GetTasksAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ScheduleItem>> GetScheduleAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<NotificationItem>> GetNotificationsAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default);
    Task<int> IncrementDownloadCountAsync(string accessToken, string tableName, Guid id, CancellationToken cancellationToken = default);
}
