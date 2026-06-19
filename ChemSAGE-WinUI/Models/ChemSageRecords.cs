using System.Text.Json.Serialization;

namespace ChemSAGE_WinUI.Models;

public sealed record AcademicResource(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("category")] string? Category,
    [property: JsonPropertyName("subject")] string? Subject,
    [property: JsonPropertyName("file_url")] string? FileUrl,
    [property: JsonPropertyName("download_count")] int DownloadCount,
    [property: JsonPropertyName("status")] string? Status,
    [property: JsonPropertyName("created_at")] DateTimeOffset? CreatedAt);

public sealed record ExamPaper(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("subject")] string? Subject,
    [property: JsonPropertyName("year")] int? Year,
    [property: JsonPropertyName("semester")] string? Semester,
    [property: JsonPropertyName("exam_type")] string? ExamType,
    [property: JsonPropertyName("file_url")] string? FileUrl,
    [property: JsonPropertyName("download_count")] int DownloadCount,
    [property: JsonPropertyName("status")] string? Status);

public sealed record StudyCircle(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("location")] string? Location,
    [property: JsonPropertyName("is_public")] bool IsPublic,
    [property: JsonPropertyName("created_by")] Guid? CreatedBy);

public sealed record TaskItem(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("status")] string? Status,
    [property: JsonPropertyName("priority")] string? Priority,
    [property: JsonPropertyName("due_date")] DateTimeOffset? DueDate);

public sealed record ScheduleItem(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("start_time")] DateTimeOffset StartTime,
    [property: JsonPropertyName("end_time")] DateTimeOffset? EndTime,
    [property: JsonPropertyName("location")] string? Location);

public sealed record NotificationItem(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("message")] string? Message,
    [property: JsonPropertyName("is_read")] bool IsRead,
    [property: JsonPropertyName("created_at")] DateTimeOffset CreatedAt);

public sealed record AdminStats(
    [property: JsonPropertyName("active_students")] int ActiveStudents,
    [property: JsonPropertyName("active_users")] int ActiveUsers,
    [property: JsonPropertyName("pending_users")] int PendingUsers,
    [property: JsonPropertyName("total_resources")] int TotalResources,
    [property: JsonPropertyName("total_papers")] int TotalPapers,
    [property: JsonPropertyName("total_rooms")] int TotalRooms,
    [property: JsonPropertyName("total_storage_bytes")] long TotalStorageBytes);

public sealed record OrphanUser(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("created_at")] DateTimeOffset? CreatedAt);

public sealed record ProfileAnalytics(
    [property: JsonPropertyName("resources_uploaded")] int ResourcesUploaded,
    [property: JsonPropertyName("resources_archived")] int ResourcesArchived,
    [property: JsonPropertyName("papers_shared")] int PapersShared,
    [property: JsonPropertyName("total_downloads")] int TotalDownloads,
    [property: JsonPropertyName("circles_joined")] int CirclesJoined,
    [property: JsonPropertyName("bookmarks")] int Bookmarks,
    [property: JsonPropertyName("activity_count")] int ActivityCount,
    [property: JsonPropertyName("account_age_days")] int AccountAgeDays);
