using System;

namespace WaDesktop.Domain.Interfaces
{
    /// <summary>
    /// Pure MVP interface — no WinForms types leaked.
    /// Content is IViewBase; ShellView casts to Control internally.
    /// </summary>
    public interface IShellView : IViewBase
    {
        string StatusText { get; set; }

        event EventHandler DashboardClicked;
        event EventHandler CompanyClicked;
        event EventHandler UsersClicked;
        event EventHandler TemplatesClicked;
        event EventHandler AppSettingsClicked;
        event EventHandler LogoutClicked;

        bool AppSettingsVisible { set; }

        void AddOrSelectTab(string key, string title, IViewBase content);
        void CloseTab(string key);
        void ClearTabs();
    }
}
