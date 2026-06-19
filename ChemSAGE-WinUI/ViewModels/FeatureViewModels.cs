using ChemSAGE_WinUI.Contracts;
using ChemSAGE_WinUI.Models;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace ChemSAGE_WinUI.ViewModels;

public abstract partial class AuthenticatedFeatureViewModel(ISupabaseAuthService authService) : ViewModelBase
{
    [ObservableProperty] private string emptyState = "Sign in to sync this workspace with ChemSAGE.";

    protected async Task<AuthSession?> GetSessionAsync()
    {
        var session = await authService.RestoreSessionAsync();
        EmptyState = session is null ? "Sign in to sync this workspace with ChemSAGE." : "No records matched the current ChemSAGE filters.";
        return session;
    }

    protected async Task RunLoadAsync(Func<AuthSession, Task> load)
    {
        IsBusy = true;
        ErrorMessage = null;
        try
        {
            var session = await GetSessionAsync();
            if (session is not null)
            {
                await load(session);
            }
        }
        catch (HttpRequestException ex)
        {
            ErrorMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }
}

public sealed partial class ResourceVaultViewModel(ISupabaseAuthService authService, ISupabaseDataService dataService, IToastNotificationService toastService) : AuthenticatedFeatureViewModel(authService)
{
    [ObservableProperty] private IReadOnlyList<AcademicResource> resources = Array.Empty<AcademicResource>();

    [RelayCommand]
    public Task LoadAsync() => RunLoadAsync(async session => Resources = await dataService.GetResourcesAsync(session.AccessToken));

    [RelayCommand]
    private async Task RegisterDownloadAsync(AcademicResource resource)
    {
        var session = await GetSessionAsync();
        if (session is null) return;
        var count = await dataService.IncrementDownloadCountAsync(session.AccessToken, "resources", resource.Id);
        await toastService.ShowAsync("Resource download synced", $"{resource.Title} now has {count} downloads.");
    }
}

public sealed partial class PastPapersViewModel(ISupabaseAuthService authService, ISupabaseDataService dataService, IToastNotificationService toastService) : AuthenticatedFeatureViewModel(authService)
{
    [ObservableProperty] private IReadOnlyList<ExamPaper> papers = Array.Empty<ExamPaper>();

    [RelayCommand]
    public Task LoadAsync() => RunLoadAsync(async session => Papers = await dataService.GetPastPapersAsync(session.AccessToken));

    [RelayCommand]
    private async Task RegisterDownloadAsync(ExamPaper paper)
    {
        var session = await GetSessionAsync();
        if (session is null) return;
        var count = await dataService.IncrementDownloadCountAsync(session.AccessToken, "exam_papers", paper.Id);
        await toastService.ShowAsync("Past paper download synced", $"{paper.Title} now has {count} downloads.");
    }
}

public sealed partial class StudyCirclesViewModel(ISupabaseAuthService authService, ISupabaseDataService dataService) : AuthenticatedFeatureViewModel(authService)
{
    [ObservableProperty] private IReadOnlyList<StudyCircle> circles = Array.Empty<StudyCircle>();

    [RelayCommand]
    public Task LoadAsync() => RunLoadAsync(async session => Circles = await dataService.GetStudyCirclesAsync(session.AccessToken, session.User.Id));
}

public sealed partial class TasksViewModel(ISupabaseAuthService authService, ISupabaseDataService dataService) : AuthenticatedFeatureViewModel(authService)
{
    [ObservableProperty] private IReadOnlyList<TaskItem> tasks = Array.Empty<TaskItem>();
    [ObservableProperty] private IReadOnlyList<ScheduleItem> schedule = Array.Empty<ScheduleItem>();

    [RelayCommand]
    public Task LoadAsync() => RunLoadAsync(async session =>
    {
        Tasks = await dataService.GetTasksAsync(session.AccessToken, session.User.Id);
        Schedule = await dataService.GetScheduleAsync(session.AccessToken, session.User.Id);
    });
}

public sealed partial class ProfileViewModel(ISupabaseAuthService authService, IProfileService profileService, IDatabaseFunctionService databaseFunctionService) : AuthenticatedFeatureViewModel(authService)
{
    [ObservableProperty] private UserProfile? profile;
    [ObservableProperty] private ProfileAnalytics? analytics;

    [RelayCommand]
    public Task LoadAsync() => RunLoadAsync(async session =>
    {
        Profile = await profileService.GetCurrentProfileAsync(session.AccessToken, session.User.Id);
        Analytics = await databaseFunctionService.GetProfileAnalyticsAsync(session.AccessToken, session.User.Id);
    });
}

public sealed partial class SettingsViewModel(ISupabaseAuthService authService, ISupabaseDataService dataService) : AuthenticatedFeatureViewModel(authService)
{
    [ObservableProperty] private IReadOnlyList<NotificationItem> notifications = Array.Empty<NotificationItem>();

    [RelayCommand]
    public Task LoadAsync() => RunLoadAsync(async session => Notifications = await dataService.GetNotificationsAsync(session.AccessToken, session.User.Id));
}

public sealed partial class AdminPanelViewModel(ISupabaseAuthService authService, IDatabaseFunctionService databaseFunctionService) : AuthenticatedFeatureViewModel(authService)
{
    [ObservableProperty] private AdminStats? stats;
    [ObservableProperty] private IReadOnlyList<OrphanUser> orphanUsers = Array.Empty<OrphanUser>();

    [RelayCommand]
    public Task LoadAsync() => RunLoadAsync(async session =>
    {
        Stats = await databaseFunctionService.GetAdminStatsAsync(session.AccessToken);
        OrphanUsers = await databaseFunctionService.GetOrphanUsersAsync(session.AccessToken);
    });
}
