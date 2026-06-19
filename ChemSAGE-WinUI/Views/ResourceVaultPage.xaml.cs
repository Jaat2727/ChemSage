using ChemSAGE_WinUI.ViewModels;
using Microsoft.UI.Xaml.Controls;

namespace ChemSAGE_WinUI.Views;

public sealed partial class ResourceVaultPage : Page
{
    public ResourceVaultViewModel ViewModel { get; } = App.GetService<ResourceVaultViewModel>();

    public ResourceVaultPage()
    {
        InitializeComponent();
        DataContext = ViewModel;
        Loaded += async (_, _) => await ViewModel.LoadCommand.ExecuteAsync(null);
    }
}
