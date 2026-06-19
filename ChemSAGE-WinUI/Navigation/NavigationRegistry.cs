using ChemSAGE_WinUI.Models;
using ChemSAGE_WinUI.Views;

namespace ChemSAGE_WinUI.Navigation;

public static class NavigationRegistry
{
    public const string Dashboard = "dashboard";
    public const string ResourceVault = "resource-vault";
    public const string PastPapers = "past-papers";
    public const string StudyCircles = "study-circles";
    public const string Tasks = "tasks";
    public const string Profile = "profile";
    public const string Settings = "settings";
    public const string AdminPanel = "admin-panel";

    public static IReadOnlyList<NavigationItem> Items { get; } = new[]
    {
        new NavigationItem(Dashboard, "Dashboard", "Home", typeof(DashboardPage)),
        new NavigationItem(ResourceVault, "Resource Vault", "Library", typeof(ResourceVaultPage)),
        new NavigationItem(PastPapers, "Past Papers", "Document", typeof(PastPapersPage)),
        new NavigationItem(StudyCircles, "Study Circles", "People", typeof(StudyCirclesPage)),
        new NavigationItem(Tasks, "Tasks", "Calendar", typeof(TasksPage)),
        new NavigationItem(Profile, "Profile", "Contact", typeof(ProfilePage)),
        new NavigationItem(Settings, "Settings", "Setting", typeof(SettingsPage)),
        new NavigationItem(AdminPanel, "Admin Panel", "Admin", typeof(AdminPanelPage), true)
    };
}
