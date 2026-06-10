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
        bool SidebarCollapsed { set; }
        bool CompanyVisible { set; }
        bool UsersVisible { set; }
        bool TemplatesVisible { set; }

        void AddOrSelectTab(string key, string title, IViewBase content);
        void CloseTab(string key);
        void ClearTabs();

        /// <summary>Show Windows desktop notification balloon.</summary>
        void ShowNotification(string title, string body);

        /// <summary>Set taskbar overlay badge count. 0 or less clears the badge.</summary>
        void SetBadge(int count);
    }
}
