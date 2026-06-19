using ChemSAGE_WinUI.Models;
using ChemSAGE_WinUI.Navigation;

namespace ChemSAGE_WinUI.ViewModels;

public sealed class ShellViewModel
{
    public IReadOnlyList<NavigationItem> NavigationItems => NavigationRegistry.Items;
}
