using ChemSAGE_WinUI.Contracts;
using ChemSAGE_WinUI.Models;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace ChemSAGE_WinUI.ViewModels;

public sealed partial class ResourceVaultViewModel(ISupabaseAuthService authService, IResourceService resourceService, IFilePickerService filePickerService, IToastNotificationService toastService) : AuthenticatedFeatureViewModel(authService)
{
    private CancellationTokenSource? _loadCancellation;

    [ObservableProperty] private IReadOnlyList<ResourceItem> resources = Array.Empty<ResourceItem>();
    [ObservableProperty] private ResourceItem? selectedResource;
    [ObservableProperty] private string searchText = string.Empty;
    [ObservableProperty] private string? selectedCourse;
    [ObservableProperty] private string? selectedSemester;
    [ObservableProperty] private string? selectedResourceType;
    [ObservableProperty] private bool isUploading;
    [ObservableProperty] private bool isDownloading;
    [ObservableProperty] private double transferProgress;
    [ObservableProperty] private string uploadTitle = string.Empty;
    [ObservableProperty] private string uploadDescription = string.Empty;
    [ObservableProperty] private string uploadCourse = string.Empty;
    [ObservableProperty] private string uploadSemester = string.Empty;
    [ObservableProperty] private string uploadResourceType = "Notes";

    public bool HasResources => Resources.Count > 0;
    public bool IsResourceListEmpty => !IsBusy && Resources.Count == 0;

    public IReadOnlyList<string> Courses => Resources.Select(r => r.Course).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().Order().Cast<string>().ToArray();
    public IReadOnlyList<string> Semesters => Resources.Select(r => r.Semester).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().Order().Cast<string>().ToArray();
    public IReadOnlyList<string> ResourceTypes => new[] { "Notes", "Lab Reports", "Assignments", "References", "Books", "Faculty Material" };

    partial void OnResourcesChanged(IReadOnlyList<ResourceItem> value)
    {
        OnPropertyChanged(nameof(HasResources));
        OnPropertyChanged(nameof(IsResourceListEmpty));
    }

    [RelayCommand]
    public async Task LoadAsync()
    {
        _loadCancellation?.Cancel();
        _loadCancellation = new CancellationTokenSource();
        var token = _loadCancellation.Token;
        await RunLoadAsync(async session =>
        {
            Resources = await resourceService.GetResourcesAsync(session.AccessToken, new ResourceQuery(SearchText, SelectedCourse, SelectedSemester, SelectedResourceType), token);
            OnPropertyChanged(nameof(Courses));
            OnPropertyChanged(nameof(Semesters));
        });
        OnPropertyChanged(nameof(IsResourceListEmpty));
    }

    [RelayCommand]
    private async Task ClearFiltersAsync()
    {
        SearchText = string.Empty;
        SelectedCourse = null;
        SelectedSemester = null;
        SelectedResourceType = null;
        await LoadAsync();
    }

    [RelayCommand]
    private async Task DownloadSelectedAsync()
    {
        if (SelectedResource is null)
        {
            await toastService.ShowAsync("Select a resource", "Choose a resource before downloading.");
            return;
        }

        var session = await GetSessionAsync();
        if (session is null) return;

        IsDownloading = true;
        TransferProgress = 0;
        try
        {
            var download = await resourceService.DownloadResourceAsync(session.AccessToken, SelectedResource, new Progress<double>(p => TransferProgress = p));
            var savedPath = await SaveToDownloadsAsync(download);
            await toastService.ShowAsync("Download complete", $"Saved {download.FileName} to {savedPath}.");
            await LoadAsync();
        }
        catch (Exception ex) when (ex is IOException or HttpRequestException or UnauthorizedAccessException)
        {
            ErrorMessage = ex.Message;
        }
        finally
        {
            IsDownloading = false;
        }
    }

    [RelayCommand]
    private async Task UploadAsync()
    {
        var session = await GetSessionAsync();
        if (session is null) return;
        var files = await filePickerService.PickFilesAsync(new[] { ".pdf", ".docx", ".pptx", ".zip", ".png", ".jpg" });
        var filePath = files.FirstOrDefault();
        if (filePath is null) return;

        IsUploading = true;
        TransferProgress = 0;
        try
        {
            var title = string.IsNullOrWhiteSpace(UploadTitle) ? Path.GetFileNameWithoutExtension(filePath) : UploadTitle;
            await resourceService.UploadResourceAsync(session.AccessToken, session.User.Id, new ResourceUploadRequest(title, UploadDescription, UploadCourse, UploadSemester, UploadResourceType, filePath, GetContentType(filePath)), new Progress<double>(p => TransferProgress = p));
            await toastService.ShowAsync("Resource uploaded", $"{title} is now available in the Resource Vault.");
            await LoadAsync();
        }
        catch (Exception ex) when (ex is IOException or HttpRequestException or UnauthorizedAccessException)
        {
            ErrorMessage = ex.Message;
        }
        finally
        {
            IsUploading = false;
        }
    }

    private static string GetContentType(string path) => Path.GetExtension(path).ToLowerInvariant() switch
    {
        ".pdf" => "application/pdf",
        ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".zip" => "application/zip",
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        _ => "application/octet-stream"
    };

    private static async Task<string> SaveToDownloadsAsync(StorageDownload download)
    {
        var downloads = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");
        Directory.CreateDirectory(downloads);
        var path = Path.Combine(downloads, download.FileName);
        await File.WriteAllBytesAsync(path, download.Content);
        return path;
    }

}
