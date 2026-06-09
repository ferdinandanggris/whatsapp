using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Client.Extensions;

namespace WaDesktop.Client.Views.ManagementViews
{
    public partial class CompanyView : UserControl, IManagementView<Company>
    {
        private readonly HashSet<long> _deletedIds = new HashSet<long>();
        private readonly Dictionary<(int Row, int Col), object> _originalValues = new Dictionary<(int Row, int Col), object>();

        public CompanyView()
        {
            InitializeComponent();
        }

        // ── IManagementView ──

        public IList<Company> DataSource
        {
            set
            {
                this.InvokeIfRequired(() =>
                {
                    _deletedIds.Clear();
                    _originalValues.Clear();
                    dataGridView.Rows.Clear();
                    foreach (var c in value)
                    {
                        int idx = dataGridView.Rows.Add(c.Id, c.Name, c.CreatedAt);
                        dataGridView.Rows[idx].DefaultCellStyle.BackColor = Color.White;
                        dataGridView.Rows[idx].Tag = null;
                    }
                });
            }
        }

        public int SelectedIndex => dataGridView.SelectedRows.Count > 0 ? dataGridView.SelectedRows[0].Index : -1;
        public bool IsLoading { set => this.InvokeIfRequired(() => { Cursor = value ? Cursors.WaitCursor : Cursors.Default; }); }

        public event EventHandler<string> SearchClicked;
        public event EventHandler RefreshClicked;
        public event EventHandler AddClicked;
        public event EventHandler EditClicked;
        public event EventHandler DeleteClicked;
        public event EventHandler SaveClicked;

        // ── Yellow Highlight ──

        private void MarkDirty(DataGridViewRow row)
        {
            if (row == null || row.IsNewRow) return;
            row.DefaultCellStyle.BackColor = Color.LightYellow;
            row.Tag = true;
        }

        public IList<Company> GetModifiedRows()
        {
            var list = new List<Company>();
            foreach (DataGridViewRow row in dataGridView.Rows)
            {
                if (row.IsNewRow) continue;
                if (row.Tag != null && (bool)row.Tag)
                {
                    var idCell = row.Cells["Id"].Value;
                    long id = (idCell != null && long.TryParse(idCell.ToString(), out var parsed)) ? parsed : 0;
                    list.Add(new Company
                    {
                        Id = id,
                        Name = row.Cells["Name"].Value?.ToString() ?? ""
                    });
                }
            }
            return list;
        }

        public IList<long> GetDeletedIds() => _deletedIds.ToList();

        // ── Event Handlers ──

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
                MarkDirty(dataGridView.Rows[e.RowIndex]);
        }

        private void DataGridView_UserDeletingRow(object sender, DataGridViewRowCancelEventArgs e)
        {
            var idCell = e.Row.Cells["Id"].Value;
            if (idCell != null && long.TryParse(idCell.ToString(), out var id) && id > 0)
                _deletedIds.Add(id);
        }

        private void btnSearch_Click(object sender, EventArgs e) => SearchClicked?.Invoke(this, txtSearch.Text);
        private void btnRefresh_Click(object sender, EventArgs e) => RefreshClicked?.Invoke(this, EventArgs.Empty);
        private void btnSave_Click(object sender, EventArgs e)
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
