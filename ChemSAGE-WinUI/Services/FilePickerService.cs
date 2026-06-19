using ChemSAGE_WinUI.Contracts;
using WinRT.Interop;
using Windows.Storage.Pickers;

namespace ChemSAGE_WinUI.Services;

public sealed class FilePickerService(Func<IntPtr> hwndProvider) : IFilePickerService
{
    public async Task<IReadOnlyList<string>> PickFilesAsync(IEnumerable<string> fileTypeFilters, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var picker = new FileOpenPicker { ViewMode = PickerViewMode.List };
        foreach (var filter in fileTypeFilters.DefaultIfEmpty("*"))
        {
            picker.FileTypeFilter.Add(filter);
        }
        InitializeWithWindow.Initialize(picker, hwndProvider());
        var files = await picker.PickMultipleFilesAsync();
        return files.Select(file => file.Path).ToArray();
    }
}
