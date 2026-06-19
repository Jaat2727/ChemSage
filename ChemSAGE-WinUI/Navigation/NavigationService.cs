using ChemSAGE_WinUI.Contracts;
using Microsoft.UI.Xaml.Controls;

namespace ChemSAGE_WinUI.Navigation;

public sealed class NavigationService : INavigationService
{
    private Frame? _frame;

    public void Initialize(Frame frame) => _frame = frame;

    public bool NavigateTo(string route, object? parameter = null)
    {
        var item = NavigationRegistry.Items.FirstOrDefault(i => i.Route == route);
        if (item is null || _frame is null)
        {
            return false;
        }
        return _frame.Navigate(item.PageType, parameter);
    }

    public bool GoBack()
    {
        if (_frame?.CanGoBack != true)
        {
            return false;
        }
        _frame.GoBack();
        return true;
    }
}
