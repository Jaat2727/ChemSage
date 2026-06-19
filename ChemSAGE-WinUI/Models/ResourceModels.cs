using System.Text.Json.Serialization;

namespace ChemSAGE_WinUI.Models;

public sealed record ResourceItem(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("category")] string? ResourceType,
    [property: JsonPropertyName("subject")] string? Course,
    [property: JsonPropertyName("semester")] string? Semester,
    [property: JsonPropertyName("course_code")] string? CourseCode,
    [property: JsonPropertyName("file_url")] string FileUrl,
    [property: JsonPropertyName("file_type")] string? FileType,
    [property: JsonPropertyName("file_size")] long? FileSize,
    [property: JsonPropertyName("uploaded_by")] Guid UploadedBy,
    [property: JsonPropertyName("download_count")] int DownloadCount,
    [property: JsonPropertyName("version")] string? Version,
    [property: JsonPropertyName("status")] string? Status,
    [property: JsonPropertyName("created_at")] DateTimeOffset CreatedAt);

public sealed record ResourceQuery(string? SearchText = null, string? Course = null, string? Semester = null, string? ResourceType = null);

public sealed record ResourceUploadRequest(
    string Title,
    string? Description,
    string? Course,
    string? Semester,
    string ResourceType,
    string FilePath,
    string ContentType);

public sealed record StorageDownload(string FileName, string ContentType, byte[] Content);
