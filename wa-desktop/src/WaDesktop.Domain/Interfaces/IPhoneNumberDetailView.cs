using System;
using System.Collections.Generic;
using WaDesktop.Domain.Entities;

namespace WaDesktop.Domain.Interfaces
{
    public interface IPhoneNumberDetailView : IViewBase
    {
        // ── Data ──
        void LoadDetail(PhoneNumberDetail detail);
        void LoadCompanies(IList<Company> companies);

        // ── Field accessors for save ──
        string DisplayName { get; }
        string Description { get; }
        string Email { get; }
        string About { get; }
        string Address { get; }
        string Vertical { get; }
        string WebsitesText { get; }
        long? SelectedCompanyId { get; }

        // ── Picture ──
        void LoadProfilePicture(byte[] imageData);
        string PendingUploadPath { get; }

        // ── State ──
        bool IsSaving { set; }

        // ── Events ──
        event EventHandler SaveClicked;
        event EventHandler FetchFromMetaClicked;
        event EventHandler UploadPhotoClicked;
        event EventHandler RefreshClicked;

        // ── Feedback ──
        void ShowError(string message);
        void ShowWarning(string message);
        void ShowSuccess(string message);
    }
}
