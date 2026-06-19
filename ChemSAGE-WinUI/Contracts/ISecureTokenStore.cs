using ChemSAGE_WinUI.Models;

namespace ChemSAGE_WinUI.Contracts;

public interface ISecureTokenStore
{
    Task SaveAsync(AuthSession session, CancellationToken cancellationToken = default);
    Task<AuthSession?> ReadAsync(CancellationToken cancellationToken = default);
    Task ClearAsync(CancellationToken cancellationToken = default);
}
