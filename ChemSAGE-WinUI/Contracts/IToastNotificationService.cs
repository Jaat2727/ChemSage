namespace ChemSAGE_WinUI.Contracts;

public interface IToastNotificationService
{
    Task ShowAsync(string title, string message, CancellationToken cancellationToken = default);
}
