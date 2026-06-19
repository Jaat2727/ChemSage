using ChemSAGE_WinUI.ViewModels;
using Microsoft.UI.Xaml.Controls;

namespace ChemSAGE_WinUI.Views;

public sealed partial class DashboardPage : Page
{
    public DashboardViewModel ViewModel { get; } = App.GetService<DashboardViewModel>();
    public DashboardPage()
    {
        InitializeComponent();
        DataContext = ViewModel;
        Loaded += async (_, _) => await ViewModel.LoadCommand.ExecuteAsync(null);
    }
}
