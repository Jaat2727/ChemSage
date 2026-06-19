using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace ChemSAGE_WinUI.Components;

public sealed partial class SearchBar : UserControl
{
    public static readonly DependencyProperty TextProperty = DependencyProperty.Register(nameof(Text), typeof(string), typeof(SearchBar), new PropertyMetadata(string.Empty));
    public string Text { get => (string)GetValue(TextProperty); set => SetValue(TextProperty, value); }
    public SearchBar() => InitializeComponent();
}
