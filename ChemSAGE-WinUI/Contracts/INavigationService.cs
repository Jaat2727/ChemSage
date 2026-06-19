namespace ChemSAGE_WinUI.Contracts;

public interface INavigationService
{
    bool NavigateTo(string route, object? parameter = null);
    bool GoBack();
}
