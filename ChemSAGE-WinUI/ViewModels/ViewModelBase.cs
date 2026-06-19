using CommunityToolkit.Mvvm.ComponentModel;

namespace ChemSAGE_WinUI.ViewModels;

public abstract partial class ViewModelBase : ObservableObject
{
    [ObservableProperty]
    private bool isBusy;

    [ObservableProperty]
    private string? errorMessage;
}
