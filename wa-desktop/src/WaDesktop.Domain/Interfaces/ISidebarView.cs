using System;
using System.Collections.Generic;
using WaDesktop.Domain.Entities;

namespace WaDesktop.Domain.Interfaces
{
    public interface ISidebarView : IViewBase
    {
        /// <summary>Set data tree dari WA Phone Numbers.</summary>
        void LoadPhoneNumbers(IList<PhoneNumberNode> nodes);

        /// <summary>Event: node di tree diklik. Kirim wa_id + phone_number_id.</summary>
        event EventHandler<PhoneNumberSelectedEventArgs> PhoneNumberSelected;

        /// <summary>Tampilkan loading indicator.</summary>
        bool IsLoading { set; }
    }

    public class PhoneNumberSelectedEventArgs : EventArgs
    {
        public string PhoneNumberId { get; }
        public string WaId { get; }
        public string DisplayName { get; }

        public PhoneNumberSelectedEventArgs(string phoneNumberId, string waId, string displayName)
        {
            PhoneNumberId = phoneNumberId;
            WaId = waId;
            DisplayName = displayName;
        }
    }
}
