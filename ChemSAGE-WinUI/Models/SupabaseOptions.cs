namespace ChemSAGE_WinUI.Models;

public sealed class SupabaseOptions
{
    public const string SectionName = "Supabase";
    public string Url { get; set; } = string.Empty;
    public string AnonKey { get; set; } = string.Empty;
    public string WebApiBaseUrl { get; set; } = "http://localhost:3000";
    public Uri RestUri => new($"{Url.TrimEnd('/')}/rest/v1/");
    public Uri AuthUri => new($"{Url.TrimEnd('/')}/auth/v1/");
}
