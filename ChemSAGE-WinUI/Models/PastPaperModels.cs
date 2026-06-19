using System.Text.Json.Serialization;

namespace ChemSAGE_WinUI.Models;

public sealed record PastPaperItem(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("subject")] string Subject,
    [property: JsonPropertyName("exam_type")] string ExamType,
    [property: JsonPropertyName("year")] int Year,
    [property: JsonPropertyName("semester")] string Semester,
    [property: JsonPropertyName("course_code")] string? CourseCode,
    [property: JsonPropertyName("faculty")] string? Faculty,
    [property: JsonPropertyName("file_url")] string FileUrl,
    [property: JsonPropertyName("file_size")] long? FileSize,
    [property: JsonPropertyName("uploaded_by")] Guid UploadedBy,
    [property: JsonPropertyName("download_count")] int DownloadCount,
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("status")] string? Status,
    [property: JsonPropertyName("created_at")] DateTimeOffset CreatedAt);

public sealed record PastPaperQuery(string? SearchText = null, string? Subject = null, string? Semester = null, int? Year = null, string? ExamType = null);

public sealed record PastPaperUploadRequest(
    string Subject,
    string ExamType,
    int Year,
    string Semester,
    string? CourseCode,
    string? Faculty,
    string FilePath,
    string ContentType);
