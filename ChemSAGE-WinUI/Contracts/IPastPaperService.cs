using ChemSAGE_WinUI.Models;

namespace ChemSAGE_WinUI.Contracts;

public interface IPastPaperService
{
    Task<IReadOnlyList<PastPaperItem>> GetPastPapersAsync(string accessToken, PastPaperQuery query, CancellationToken cancellationToken = default);
    Task<PastPaperItem> UploadPastPaperAsync(string accessToken, Guid userId, PastPaperUploadRequest request, IProgress<double>? progress = null, CancellationToken cancellationToken = default);
    Task<StorageDownload> DownloadPastPaperAsync(string accessToken, PastPaperItem paper, IProgress<double>? progress = null, CancellationToken cancellationToken = default);
}
