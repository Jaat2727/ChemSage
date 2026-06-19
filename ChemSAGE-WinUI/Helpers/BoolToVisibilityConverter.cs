using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Data;

namespace ChemSAGE_WinUI.Helpers;

public sealed class BoolToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        var flag = value is bool boolValue && boolValue;
        var invert = string.Equals(parameter?.ToString(), "Invert", StringComparison.OrdinalIgnoreCase);
        if (invert)
        {
            flag = !flag;
        }
        return flag ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, string language) => value is Visibility visibility && visibility == Visibility.Visible;
}
