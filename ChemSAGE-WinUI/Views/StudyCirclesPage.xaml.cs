using ChemSAGE_WinUI.ViewModels;
using Microsoft.UI.Xaml.Controls;

namespace ChemSAGE_WinUI.Views;

public sealed partial class StudyCirclesPage : Page
{
    public StudyCirclesViewModel ViewModel { get; } = App.GetService<StudyCirclesViewModel>();

    public StudyCirclesPage()
    {
        InitializeComponent();
        DataContext = ViewModel;
        Loaded += async (_, _) => await ViewModel.LoadCommand.ExecuteAsync(null);
    }
}
