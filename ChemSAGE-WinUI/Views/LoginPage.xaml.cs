using ChemSAGE_WinUI.ViewModels;
using Microsoft.UI.Xaml.Controls;

namespace ChemSAGE_WinUI.Views;

public sealed partial class LoginPage : Page
{
    public AuthViewModel ViewModel { get; } = App.GetService<AuthViewModel>();
    public LoginPage()
    {
        InitializeComponent();
        DataContext = ViewModel;
    }
    private void OnPasswordChanged(object sender, Microsoft.UI.Xaml.RoutedEventArgs e) => ViewModel.Password = ((PasswordBox)sender).Password;
}
