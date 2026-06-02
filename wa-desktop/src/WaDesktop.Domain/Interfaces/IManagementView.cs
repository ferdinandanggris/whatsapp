using System;
using System.Collections.Generic;

namespace WaDesktop.Domain.Interfaces
{
    /// <summary>Base interface untuk semua management CRUD views.</summary>
    public interface IManagementView<T> : IViewBase where T : class
    {
        /// <summary>Data list yang ditampilkan.</summary>
        IList<T> DataSource { set; }

        /// <summary>Selected item index.</summary>
        int SelectedIndex { get; }

        /// <summary>Is loading indicator.</summary>
        bool IsLoading { set; }

        /// <summary>Search event.</summary>
        event EventHandler<string> SearchClicked;
        /// <summary>Refresh event.</summary>
        event EventHandler RefreshClicked;
        /// <summary>Add event.</summary>
        event EventHandler AddClicked;
        /// <summary>Edit event.</summary>
        event EventHandler EditClicked;
        /// <summary>Delete event.</summary>
        event EventHandler DeleteClicked;
    }
}
