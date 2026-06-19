using ChemSAGE_WinUI.Contracts;
using ChemSAGE_WinUI.Models;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace ChemSAGE_WinUI.ViewModels;

public sealed partial class DashboardViewModel(ISupabaseAuthService authService, IProfileService profileService, IFilePickerService filePickerService, IToastNotificationService toastService) : ViewModelBase
{
    [ObservableProperty] private UserProfile? profile;
    [ObservableProperty] private string welcomeMessage = "Welcome to ChemSAGE";

    public IReadOnlyList<string> RecentActivity { get; } = new[] { "Resource Vault sync ready", "Study Circles preview enabled", "Desktop session secured" };
    public IReadOnlyList<string> UpcomingDeadlines { get; } = new[] { "Physical Chemistry assignment", "Inorganic Chemistry seminar", "Lab record submission" };

    [RelayCommand]
    public async Task LoadAsync()
    {
        IsBusy = true;
        ErrorMessage = null;
        try
        {
            var session = await authService.RestoreSessionAsync();
            if (session is not null)
            {
                Profile = await profileService.GetCurrentProfileAsync(session.AccessToken, session.User.Id);
                WelcomeMessage = $"Welcome{(Profile?.FullName is { Length: > 0 } name ? $", {name}" : string.Empty)}";
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

    [RelayCommand]
    private async Task PickResourceAsync()
    {
        var files = await filePickerService.PickFilesAsync(new[] { ".pdf", ".docx", ".pptx", ".zip" });
        if (files.Count > 0)
        {
            await toastService.ShowAsync("Resource selected", $"Queued {files.Count} file(s) for a future Resource Vault upload flow.");
        }
    }
}
