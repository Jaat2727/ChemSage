using ChemSAGE_WinUI.Contracts;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace ChemSAGE_WinUI.ViewModels;

public sealed partial class AuthViewModel(ISupabaseAuthService authService, IToastNotificationService toastService) : ViewModelBase
{
    [ObservableProperty] private string email = string.Empty;
    [ObservableProperty] private string password = string.Empty;
    [ObservableProperty] private string fullName = string.Empty;
    [ObservableProperty] private bool isAuthenticated;

    public event EventHandler? AuthenticationSucceeded;

    [RelayCommand]
    private async Task SignInAsync()
    {
        await RunAuthActionAsync(async token =>
        {
            await authService.SignInAsync(Email, Password, token);
            IsAuthenticated = true;
            AuthenticationSucceeded?.Invoke(this, EventArgs.Empty);
        });
    }

    [RelayCommand]
    private async Task SignUpAsync()
    {
        await RunAuthActionAsync(async token =>
        {
            await authService.SignUpAsync(Email, Password, FullName, token);
            IsAuthenticated = true;
            AuthenticationSucceeded?.Invoke(this, EventArgs.Empty);
        });
    }

    [RelayCommand]
    private async Task RequestPasswordResetAsync()
    {
        await RunAuthActionAsync(async token =>
        {
            await authService.RequestPasswordResetAsync(Email, token);
            await toastService.ShowAsync("Password reset requested", "Check your email for the Supabase reset link.", token);
        });
    }

    private async Task RunAuthActionAsync(Func<CancellationToken, Task> action)
    {
        IsBusy = true;
        ErrorMessage = null;
        try
        {
            await action(CancellationToken.None);
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
