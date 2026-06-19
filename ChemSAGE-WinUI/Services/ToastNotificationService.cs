using ChemSAGE_WinUI.Contracts;
using Microsoft.Windows.AppNotifications;
using Microsoft.Windows.AppNotifications.Builder;

namespace ChemSAGE_WinUI.Services;

public sealed class ToastNotificationService : IToastNotificationService
{
    public Task ShowAsync(string title, string message, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var notification = new AppNotificationBuilder().AddText(title).AddText(message).BuildNotification();
        AppNotificationManager.Default.Show(notification);
        return Task.CompletedTask;
    }
}
