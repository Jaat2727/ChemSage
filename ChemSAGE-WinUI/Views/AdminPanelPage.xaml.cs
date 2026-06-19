using ChemSAGE_WinUI.ViewModels;
using Microsoft.UI.Xaml.Controls;

namespace ChemSAGE_WinUI.Views;

public sealed partial class AdminPanelPage : Page
{
    public AdminPanelViewModel ViewModel { get; } = App.GetService<AdminPanelViewModel>();

    public AdminPanelPage()
    {
        InitializeComponent();
        DataContext = ViewModel;
        Loaded += async (_, _) => await ViewModel.LoadCommand.ExecuteAsync(null);
    }
}
