using ChemSAGE_WinUI.Models;

namespace ChemSAGE_WinUI.Contracts;

public interface IProfileService
{
    Task<UserProfile?> GetCurrentProfileAsync(string accessToken, Guid userId, CancellationToken cancellationToken = default);
}
