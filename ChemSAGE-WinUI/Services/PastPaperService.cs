using ChemSAGE_WinUI.Contracts;
using ChemSAGE_WinUI.Models;
using Microsoft.Extensions.Options;

namespace ChemSAGE_WinUI.Services;

public sealed class PastPaperService(HttpClient httpClient, IOptions<SupabaseOptions> options) : SupabaseStorageService(httpClient, options), IPastPaperService
{
    private const string Bucket = "past_papers";

    public Task<IReadOnlyList<PastPaperItem>> GetPastPapersAsync(string accessToken, PastPaperQuery query, CancellationToken cancellationToken = default)
    {
        var path = "exam_papers?select=id,subject,exam_type,year,semester,course_code,faculty,file_url,file_size,uploaded_by,download_count,version,status,created_at&status=eq.active&order=year.desc&limit=250" +
                   Eq("subject", query.Subject) + Eq("semester", query.Semester) + Eq("exam_type", query.ExamType) +
                   (query.Year is null ? string.Empty : $"&year=eq.{query.Year}") +
                   ILikeAny(("subject", query.SearchText), ("course_code", query.SearchText), ("faculty", query.SearchText));
        return GetListAsync<PastPaperItem>(accessToken, path, cancellationToken);
    }

    public async Task<PastPaperItem> UploadPastPaperAsync(string accessToken, Guid userId, PastPaperUploadRequest request, IProgress<double>? progress = null, CancellationToken cancellationToken = default)
    {
        var storagePath = BuildStoragePath(userId, request.FilePath);
        await UploadObjectAsync(accessToken, Bucket, storagePath, request.FilePath, request.ContentType, progress, cancellationToken);
        var fileInfo = new FileInfo(request.FilePath);
        var inserted = await InsertSingleAsync<PastPaperItem>(accessToken, "exam_papers", new
        {
            subject = request.Subject,
            exam_type = request.ExamType,
            year = request.Year,
            semester = request.Semester,
            course_code = request.CourseCode,
            faculty = request.Faculty,
            file_url = GetPublicStorageUrl(Bucket, storagePath),
            file_size = fileInfo.Length,
            uploaded_by = userId,
            version = "1.0",
            status = "active"
        }, cancellationToken);
        progress?.Report(100);
        return inserted;
    }

    public async Task<StorageDownload> DownloadPastPaperAsync(string accessToken, PastPaperItem paper, IProgress<double>? progress = null, CancellationToken cancellationToken = default)
    {
        var download = await DownloadObjectAsync(accessToken, Bucket, paper.FileUrl, progress, cancellationToken);
        await IncrementDownloadCountAsync(accessToken, "exam_papers", paper.Id, cancellationToken);
        return download;
    }
}
