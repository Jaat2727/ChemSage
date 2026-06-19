namespace ChemSAGE_WinUI.Contracts;

public interface IFilePickerService
{
    Task<IReadOnlyList<string>> PickFilesAsync(IEnumerable<string> fileTypeFilters, CancellationToken cancellationToken = default);
}
