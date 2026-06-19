using ChemSAGE_WinUI.Navigation;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace ChemSAGE_WinUI.AppShell;

public sealed partial class MainWindow : Window
{
    private readonly NavigationService _navigationService;

    public MainWindow(NavigationService navigationService)
    {
        InitializeComponent();
        _navigationService = navigationService;
        _navigationService.Initialize(ContentFrame);
        ExtendsContentIntoTitleBar = true;
        SystemBackdrop = new MicaBackdrop();
        RootNavigation.SelectedItem = RootNavigation.MenuItems.OfType<NavigationViewItem>().First();
        _navigationService.NavigateTo(NavigationRegistry.Dashboard);
    }

    private void OnSelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
        if (args.SelectedItem is NavigationViewItem { Tag: string route })
        {
            _navigationService.NavigateTo(route);
        }
    }

    private void OnBackRequested(NavigationView sender, NavigationViewBackRequestedEventArgs args) => _navigationService.GoBack();
}
