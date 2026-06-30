using System;
using System.Collections.Generic;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Client.Extensions;

namespace WaDesktop.Client.Views.ManagementViews
{
    public partial class PhoneNumberView : UserControl, IManagementView<PhoneNumberDetail>
    {
        public PhoneNumberView()
        {
            InitializeComponent();
        }

        public IList<PhoneNumberDetail> DataSource
        {
            set
            {
                this.InvokeIfRequired(() =>
                {
                    dataGridView.Rows.Clear();
                    foreach (var p in value)
                        dataGridView.Rows.Add(p.DisplayPhone, p.DisplayName, p.QualityRating, p.CompanyName, p.CreatedAt);
                });
            }
        }

        public int SelectedIndex => dataGridView.SelectedRows.Count > 0 ? dataGridView.SelectedRows[0].Index : -1;
        public bool IsLoading { set => this.InvokeIfRequired(() => Cursor = value ? Cursors.WaitCursor : Cursors.Default); }

        public event EventHandler<string> SearchClicked;
        public event EventHandler RefreshClicked;
        public event EventHandler AddClicked;
        public event EventHandler EditClicked;
        public event EventHandler DeleteClicked;

        private void btnSearch_Click(object sender, EventArgs e) => SearchClicked?.Invoke(this, txtSearch.Text);
        private void btnRefresh_Click(object sender, EventArgs e) => RefreshClicked?.Invoke(this, EventArgs.Empty);
        private void btnAdd_Click(object sender, EventArgs e) => AddClicked?.Invoke(this, EventArgs.Empty);
        private void btnEdit_Click(object sender, EventArgs e) => EditClicked?.Invoke(this, EventArgs.Empty);
        private void btnDelete_Click(object sender, EventArgs e) => DeleteClicked?.Invoke(this, EventArgs.Empty);
        private void txtSearch_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter) SearchClicked?.Invoke(this, txtSearch.Text);
        }

        private void dataGridView_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0) EditClicked?.Invoke(this, EventArgs.Empty);
        }
    }
}
