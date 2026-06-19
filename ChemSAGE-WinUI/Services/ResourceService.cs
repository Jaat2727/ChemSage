using ChemSAGE_WinUI.Contracts;
using ChemSAGE_WinUI.Models;
using Microsoft.Extensions.Options;

namespace ChemSAGE_WinUI.Services;

public sealed class ResourceService(HttpClient httpClient, IOptions<SupabaseOptions> options) : SupabaseStorageService(httpClient, options), IResourceService
{
    private const string Bucket = "resources";

    public Task<IReadOnlyList<ResourceItem>> GetResourcesAsync(string accessToken, ResourceQuery query, CancellationToken cancellationToken = default)
    {
        var path = "resources?select=id,title,description,category,subject,semester,course_code,file_url,file_type,file_size,uploaded_by,download_count,version,status,created_at&status=eq.active&order=created_at.desc&limit=250" +
                   Eq("subject", query.Course) + Eq("semester", query.Semester) + Eq("category", query.ResourceType) +
                   ILikeAny(("title", query.SearchText), ("description", query.SearchText), ("subject", query.SearchText), ("course_code", query.SearchText));
        return GetListAsync<ResourceItem>(accessToken, path, cancellationToken);
    }

    public async Task<ResourceItem> UploadResourceAsync(string accessToken, Guid userId, ResourceUploadRequest request, IProgress<double>? progress = null, CancellationToken cancellationToken = default)
    {
        var storagePath = BuildStoragePath(userId, request.FilePath);
        await UploadObjectAsync(accessToken, Bucket, storagePath, request.FilePath, request.ContentType, progress, cancellationToken);
        var fileInfo = new FileInfo(request.FilePath);
        var inserted = await InsertSingleAsync<ResourceItem>(accessToken, "resources", new
        {
            title = request.Title,
            description = request.Description,
            category = request.ResourceType,
            subject = request.Course,
            semester = request.Semester,
            file_url = GetPublicStorageUrl(Bucket, storagePath),
            file_type = Path.GetExtension(request.FilePath).TrimStart('.').ToUpperInvariant(),
            file_size = fileInfo.Length,
            uploaded_by = userId,
            version = "1.0",
            status = "active"
        }, cancellationToken);
        progress?.Report(100);
        return inserted;
    }

    public async Task<StorageDownload> DownloadResourceAsync(string accessToken, ResourceItem resource, IProgress<double>? progress = null, CancellationToken cancellationToken = default)
    {
        var download = await DownloadObjectAsync(accessToken, Bucket, resource.FileUrl, progress, cancellationToken);
        await IncrementDownloadCountAsync(accessToken, "resources", resource.Id, cancellationToken);
        return download;
    }
}
