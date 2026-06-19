using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Data;

namespace ChemSAGE_WinUI.Helpers;

public sealed class StringToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        var hasText = !string.IsNullOrWhiteSpace(value as string);
        var invert = string.Equals(parameter?.ToString(), "Invert", StringComparison.OrdinalIgnoreCase);
        if (invert)
        {
            hasText = !hasText;
        }
        return hasText ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language) => value is Visibility visibility && visibility == Visibility.Visible ? string.Empty : null!;
}
