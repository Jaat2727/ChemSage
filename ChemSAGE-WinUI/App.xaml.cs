using ChemSAGE_WinUI.AppShell;
using ChemSAGE_WinUI.Contracts;
using ChemSAGE_WinUI.Models;
using ChemSAGE_WinUI.Navigation;
using ChemSAGE_WinUI.Services;
using ChemSAGE_WinUI.ViewModels;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.UI.Xaml;
using WinRT.Interop;

namespace ChemSAGE_WinUI;

public partial class App : Application
{
    private readonly IHost _host;
    private MainWindow? _window;

    public App()
    {
        InitializeComponent();
        _host = Host.CreateDefaultBuilder()
            .ConfigureServices((context, services) =>
            {
                services.Configure<SupabaseOptions>(context.Configuration.GetSection(SupabaseOptions.SectionName));
                services.AddHttpClient();
                services.AddSingleton<ISecureTokenStore, SecureTokenStore>();
                services.AddSingleton<ISupabaseAuthService>(sp => new SupabaseAuthService(sp.GetRequiredService<IHttpClientFactory>().CreateClient("Supabase"), sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<SupabaseOptions>>(), sp.GetRequiredService<ISecureTokenStore>()));
                services.AddSingleton<IProfileService>(sp => new ProfileService(sp.GetRequiredService<IHttpClientFactory>().CreateClient("Supabase"), sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<SupabaseOptions>>()));
                services.AddSingleton<SupabaseDataService>(sp => new SupabaseDataService(sp.GetRequiredService<IHttpClientFactory>().CreateClient("Supabase"), sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<SupabaseOptions>>()));
                services.AddSingleton<ISupabaseDataService>(sp => sp.GetRequiredService<SupabaseDataService>());
                services.AddSingleton<IDatabaseFunctionService>(sp => sp.GetRequiredService<SupabaseDataService>());
                services.AddSingleton<IToastNotificationService, ToastNotificationService>();
                services.AddSingleton<NavigationService>();
                services.AddSingleton<INavigationService>(sp => sp.GetRequiredService<NavigationService>());
                services.AddSingleton<Func<IntPtr>>(_ => () => _window is null ? IntPtr.Zero : WindowNative.GetWindowHandle(_window));
                services.AddSingleton<IFilePickerService, FilePickerService>();
                services.AddTransient<AuthViewModel>();
                services.AddTransient<DashboardViewModel>();
                services.AddTransient<ResourceVaultViewModel>();
                services.AddTransient<PastPapersViewModel>();
                services.AddTransient<StudyCirclesViewModel>();
                services.AddTransient<TasksViewModel>();
                services.AddTransient<ProfileViewModel>();
                services.AddTransient<SettingsViewModel>();
                services.AddTransient<AdminPanelViewModel>();
                services.AddSingleton<ShellViewModel>();
                services.AddSingleton<MainWindow>();
            })
            .Build();
    }

    public static T GetService<T>() where T : notnull => ((App)Current)._host.Services.GetRequiredService<T>();

    protected override async void OnLaunched(LaunchActivatedEventArgs args)
    {
        await _host.StartAsync();
        _window = _host.Services.GetRequiredService<MainWindow>();
        _window.Activate();
    }
}
