using System.Text.Json;
using ChemSAGE_WinUI.Contracts;
using ChemSAGE_WinUI.Models;
using Windows.Security.Credentials;

namespace ChemSAGE_WinUI.Services;

public sealed class SecureTokenStore : ISecureTokenStore
{
    private const string Resource = "ChemSAGE.Supabase.Session";
    private const string UserName = "current";

    public Task SaveAsync(AuthSession session, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ClearVaultEntries();
        var vault = new PasswordVault();
        vault.Add(new PasswordCredential(Resource, UserName, JsonSerializer.Serialize(session)));
        return Task.CompletedTask;
    }

    public Task<AuthSession?> ReadAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        try
        {
            var credential = new PasswordVault().Retrieve(Resource, UserName);
            credential.RetrievePassword();
            return Task.FromResult(JsonSerializer.Deserialize<AuthSession>(credential.Password));
        }
        catch (Exception)
        {
            return Task.FromResult<AuthSession?>(null);
        }
    }

    public Task ClearAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ClearVaultEntries();
        return Task.CompletedTask;
    }

    private static void ClearVaultEntries()
    {
        var vault = new PasswordVault();
        try
        {
            foreach (var credential in vault.FindAllByResource(Resource))
            {
                vault.Remove(credential);
            }
        }
        catch (Exception)
        {
        }
    }
}
