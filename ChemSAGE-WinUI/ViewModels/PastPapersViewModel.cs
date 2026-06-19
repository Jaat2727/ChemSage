using ChemSAGE_WinUI.Contracts;
using ChemSAGE_WinUI.Models;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace ChemSAGE_WinUI.ViewModels;

public sealed partial class PastPapersViewModel(ISupabaseAuthService authService, IPastPaperService pastPaperService, IToastNotificationService toastService) : AuthenticatedFeatureViewModel(authService)
{
    private CancellationTokenSource? _loadCancellation;

    [ObservableProperty] private IReadOnlyList<PastPaperItem> papers = Array.Empty<PastPaperItem>();
    [ObservableProperty] private PastPaperItem? selectedPaper;
    [ObservableProperty] private string searchText = string.Empty;
    [ObservableProperty] private string? selectedSubject;
    [ObservableProperty] private string? selectedSemester;
    [ObservableProperty] private int? selectedYear;
    [ObservableProperty] private string? selectedExamType;
    [ObservableProperty] private bool isDownloading;
    [ObservableProperty] private double transferProgress;

    public bool HasPapers => Papers.Count > 0;
    public bool IsPaperListEmpty => !IsBusy && Papers.Count == 0;

    public IReadOnlyList<string> Subjects => Papers.Select(p => p.Subject).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().Order().ToArray();
    public IReadOnlyList<string> Semesters => Papers.Select(p => p.Semester).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct().Order().ToArray();
    public IReadOnlyList<int> Years => Papers.Select(p => p.Year).Distinct().OrderDescending().ToArray();
    public IReadOnlyList<string> ExamTypes => new[] { "End Sem", "Mid Sem", "Quiz", "Lab Exam" };

    partial void OnPapersChanged(IReadOnlyList<PastPaperItem> value)
    {
        OnPropertyChanged(nameof(HasPapers));
        OnPropertyChanged(nameof(IsPaperListEmpty));
    }

    [RelayCommand]
    public async Task LoadAsync()
    {
        _loadCancellation?.Cancel();
        _loadCancellation = new CancellationTokenSource();
        var token = _loadCancellation.Token;
        await RunLoadAsync(async session =>
        {
            Papers = await pastPaperService.GetPastPapersAsync(session.AccessToken, new PastPaperQuery(SearchText, SelectedSubject, SelectedSemester, SelectedYear, SelectedExamType), token);
            OnPropertyChanged(nameof(Subjects));
            OnPropertyChanged(nameof(Semesters));
            OnPropertyChanged(nameof(Years));
        });
        OnPropertyChanged(nameof(IsPaperListEmpty));
    }

    [RelayCommand]
    private async Task ClearFiltersAsync()
    {
        SearchText = string.Empty;
        SelectedSubject = null;
        SelectedSemester = null;
        SelectedYear = null;
        SelectedExamType = null;
        await LoadAsync();
    }

    [RelayCommand]
    private async Task DownloadSelectedAsync()
    {
        if (SelectedPaper is null)
        {
            await toastService.ShowAsync("Select a paper", "Choose a past paper before downloading.");
            return;
        }

        var session = await GetSessionAsync();
        if (session is null) return;

        IsDownloading = true;
        TransferProgress = 0;
        try
        {
            var download = await pastPaperService.DownloadPastPaperAsync(session.AccessToken, SelectedPaper, new Progress<double>(p => TransferProgress = p));
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

    private static async Task<string> SaveToDownloadsAsync(StorageDownload download)
    {
        var downloads = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");
        Directory.CreateDirectory(downloads);
        var path = Path.Combine(downloads, download.FileName);
        await File.WriteAllBytesAsync(path, download.Content);
        return path;
    }

}
