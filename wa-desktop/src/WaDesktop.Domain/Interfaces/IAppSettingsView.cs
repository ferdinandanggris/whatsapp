using System;

namespace WaDesktop.Domain.Interfaces
{
    public interface IAppSettingsView : IViewBase
    {
        string WebhookUrl { get; set; }
        string ApiKey { get; set; }
        string WabaId { get; set; }
        bool IsSaving { set; }

        event EventHandler SaveClicked;
        event EventHandler RefreshClicked;

        void ShowSuccess(string message);
        void ShowWarning(string message);
        void ShowError(string message);
    }
}
