using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Client.Extensions;

namespace WaDesktop.Client.Views.ManagementViews
{
    public partial class WabaView : UserControl, IManagementView<Waba>
    {
        private readonly Dictionary<(int Row, int Col), object> _originalValues = new Dictionary<(int Row, int Col), object>();

        public WabaView()
        {
            InitializeComponent();
            dataGridView.CellBeginEdit += DataGridView_CellBeginEdit;
            dataGridView.CellEndEdit += DataGridView_CellEndEdit;
            dataGridView.DataError += DataGridView_DataError;
        }

        public IList<Waba> DataSource
        {
            set
            {
                this.InvokeIfRequired(() =>
                {
                    _originalValues.Clear();
                    dataGridView.Rows.Clear();

                    // Ensure columns exist
                    if (dataGridView.Columns.Count == 4)
                    {
                    }

                    foreach (var w in value)
                    {
                        int idx = dataGridView.Rows.Add(
                            w.WabaId, w.Name, w.CompanyId, w.CreatedAt
                        );
                        dataGridView.Rows[idx].DefaultCellStyle.BackColor = Color.White;
                        dataGridView.Rows[idx].Tag = w; // Store the object
                    }
                });
            }
        }

        public void SetCompanyDataSource(IList<Company> companies)
        {
            this.InvokeIfRequired(() =>
            {
                var col = dataGridView.Columns["Company"] as DataGridViewComboBoxColumn;
                if (col != null)
                {
                    col.DataSource = new List<Company>(companies);
                    col.DisplayMember = "Name";
                    col.ValueMember = "Id";
                }
            });
        }

        public int SelectedIndex => dataGridView.SelectedRows.Count > 0 ? dataGridView.SelectedRows[0].Index : -1;
        public string SelectedWabaId
        {
            get
            {
                try
                {

                    if (SelectedIndex < 0) return null;
                    return dataGridView.Rows[SelectedIndex].Cells["WabaId"].Value?.ToString();
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Error getting selected WABA ID: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return null;
                }
            }
        }
        public string SelectedCompanyId
        {
            get
            {
                if (SelectedIndex < 0) return null;
                var val = dataGridView.Rows[SelectedIndex].Cells["Company"].Value;
                return val?.ToString();
            }
        }

        public bool IsLoading { set => this.InvokeIfRequired(() => Cursor = value ? Cursors.WaitCursor : Cursors.Default); }

        public event EventHandler<string> SearchClicked;
        public event EventHandler RefreshClicked;
        public event EventHandler AddClicked;
        public event EventHandler EditClicked;
        public event EventHandler DeleteClicked;
        public event EventHandler SaveClicked;
        public event EventHandler SyncClicked;

        private void MarkDirty(DataGridViewRow row)
        {
            if (row == null || row.IsNewRow) return;
            row.DefaultCellStyle.BackColor = Color.LightYellow;
            row.Tag = true;
        }

        private void DataGridView_CellBeginEdit(object sender, DataGridViewCellCancelEventArgs e)
        {
            var key = (e.RowIndex, e.ColumnIndex);
            if (!_originalValues.ContainsKey(key))
                _originalValues[key] = dataGridView[e.ColumnIndex, e.RowIndex].Value;
        }

        private void DataGridView_CellEndEdit(object sender, DataGridViewCellEventArgs e)
        {
            var key = (e.RowIndex, e.ColumnIndex);
            if (!_originalValues.TryGetValue(key, out var oldValue)) return;

            var newValue = dataGridView[e.ColumnIndex, e.RowIndex].Value;
            bool changed = !Equals(oldValue, newValue);
            _originalValues.Remove(key);

            if (changed)
            {
                MarkDirty(dataGridView.Rows[e.RowIndex]);
            }
        }

        private void DataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
        {
            if (dataGridView.Columns[e.ColumnIndex] is DataGridViewComboBoxColumn)
                e.ThrowException = false;
            else
                e.ThrowException = true;
        }

        private void btnSearch_Click(object sender, EventArgs e) => SearchClicked?.Invoke(this, txtSearch.Text);
        private void btnRefresh_Click(object sender, EventArgs e) => RefreshClicked?.Invoke(this, EventArgs.Empty);
        private void btnAdd_Click(object sender, EventArgs e) => AddClicked?.Invoke(this, EventArgs.Empty);
        private void btnEdit_Click(object sender, EventArgs e) => EditClicked?.Invoke(this, EventArgs.Empty);
        private void btnDelete_Click(object sender, EventArgs e) => DeleteClicked?.Invoke(this, EventArgs.Empty);
        private void btnSync_Click(object sender, EventArgs e) => SyncClicked?.Invoke(this, EventArgs.Empty);
        private void BtnSave_Click(object sender, EventArgs e)
        {
            dataGridView.EndEdit();
            SaveClicked?.Invoke(this, EventArgs.Empty);
        }
        private void txtSearch_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter) SearchClicked?.Invoke(this, txtSearch.Text);
        }
    }
}