using ChemSAGE_WinUI.Models;

namespace ChemSAGE_WinUI.Contracts;

public interface IResourceService
{
    Task<IReadOnlyList<ResourceItem>> GetResourcesAsync(string accessToken, ResourceQuery query, CancellationToken cancellationToken = default);
    Task<ResourceItem> UploadResourceAsync(string accessToken, Guid userId, ResourceUploadRequest request, IProgress<double>? progress = null, CancellationToken cancellationToken = default);
    Task<StorageDownload> DownloadResourceAsync(string accessToken, ResourceItem resource, IProgress<double>? progress = null, CancellationToken cancellationToken = default);
}
