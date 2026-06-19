namespace ChemSAGE_WinUI.Models;

public sealed record NavigationItem(string Route, string Title, string Glyph, Type PageType, bool RequiresAdmin = false);
