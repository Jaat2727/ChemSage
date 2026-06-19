using ChemSAGE_WinUI.Models;

namespace ChemSAGE_WinUI.Contracts;

public interface ISupabaseAuthService
{
    Task<AuthSession?> RestoreSessionAsync(CancellationToken cancellationToken = default);
    Task<AuthSession> SignInAsync(string email, string password, CancellationToken cancellationToken = default);
    Task<AuthSession> SignUpAsync(string email, string password, string fullName, CancellationToken cancellationToken = default);
    Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default);
    Task SignOutAsync(CancellationToken cancellationToken = default);
}
