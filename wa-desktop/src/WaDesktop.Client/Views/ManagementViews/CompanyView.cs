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
        private readonly HashSet<string> _deletedIds = new HashSet<string>();
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

                    if (dataGridView.Columns.Count == 3)
                    {
                        dataGridView.Columns.Add(new DataGridViewTextBoxColumn { Name = "LimitMarketing", HeaderText = "Limit Mkt" });
                        dataGridView.Columns.Add(new DataGridViewTextBoxColumn { Name = "LimitUtility", HeaderText = "Limit Util" });
                        dataGridView.Columns.Add(new DataGridViewTextBoxColumn { Name = "LimitAuthentication", HeaderText = "Limit Auth" });
                        dataGridView.Columns.Add(new DataGridViewTextBoxColumn { Name = "LimitService", HeaderText = "Limit Svc" });

                        dataGridView.Columns.Add(new DataGridViewTextBoxColumn { Name = "UsageMarketing", HeaderText = "Usage Mkt", ReadOnly = true });
                        dataGridView.Columns.Add(new DataGridViewTextBoxColumn { Name = "UsageUtility", HeaderText = "Usage Util", ReadOnly = true });
                        dataGridView.Columns.Add(new DataGridViewTextBoxColumn { Name = "UsageAuthentication", HeaderText = "Usage Auth", ReadOnly = true });
                        dataGridView.Columns.Add(new DataGridViewTextBoxColumn { Name = "UsageService", HeaderText = "Usage Svc", ReadOnly = true });

                        dataGridView.Columns.Add(new DataGridViewTextBoxColumn { Name = "CurrentCost", HeaderText = "Current Cost", ReadOnly = true });
                        dataGridView.Columns.Add(new DataGridViewTextBoxColumn { Name = "MetaCost", HeaderText = "Meta Billed Cost", ReadOnly = true });
                        dataGridView.Columns.Add(new DataGridViewTextBoxColumn { Name = "MaxEstimatedCost", HeaderText = "Max Est. Cost", ReadOnly = true });
                    }

                    foreach (var c in value)
                    {
                        int idx = dataGridView.Rows.Add(
                            c.Id, c.Name, c.CreatedAt,
                            c.LimitMarketing, c.LimitUtility, c.LimitAuthentication, c.LimitService,
                            $"{c.UsageMarketing}", $"{c.UsageUtility}", $"{c.UsageAuthentication}", $"{c.UsageService}",
                            c.CurrentCost.ToString("C2", new System.Globalization.CultureInfo("id-ID")),
                            c.MetaCost.ToString("C2", new System.Globalization.CultureInfo("id-ID")),
                            c.MaxEstimatedCost?.ToString("C2", new System.Globalization.CultureInfo("id-ID"))
                        );
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
                    int? ParseInt(object val)
                    {
                        if (val == null || string.IsNullOrWhiteSpace(val.ToString())) return null;
                        if (int.TryParse(val.ToString(), out int res)) return res;
                        return null;
                    }

                    var idCell = row.Cells["Id"].Value?.ToString() ?? "";
                    list.Add(new Company
                    {
                        Id = idCell,
                        Name = row.Cells["Name"].Value?.ToString() ?? "",
                        LimitMarketing = ParseInt(row.Cells["LimitMarketing"].Value),
                        LimitUtility = ParseInt(row.Cells["LimitUtility"].Value),
                        LimitAuthentication = ParseInt(row.Cells["LimitAuthentication"].Value),
                        LimitService = ParseInt(row.Cells["LimitService"].Value)
                    });
                }
            }
            return list;
        }

        public IList<string> GetDeletedIds() => _deletedIds.ToList();

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
            {
                MarkDirty(dataGridView.Rows[e.RowIndex]);
                RecalculateRow(dataGridView.Rows[e.RowIndex]);
            }
        }

        private void RecalculateRow(DataGridViewRow row)
        {
            try
            {
                int? ParseInt(object val)
                {
                    if (val == null || string.IsNullOrWhiteSpace(val.ToString())) return null;
                    if (int.TryParse(val.ToString(), out int result)) return result;
                    return null;
                }

                int? limitMkt = ParseInt(row.Cells["LimitMarketing"].Value);
                int? limitUtl = ParseInt(row.Cells["LimitUtility"].Value);
                int? limitAuth = ParseInt(row.Cells["LimitAuthentication"].Value);

                decimal? maxEst = ((limitMkt ?? 0) * 586.33m) + ((limitUtl ?? 0) * 356.65m) + ((limitAuth ?? 0) * 356.65m);
                row.Cells["MaxEstimatedCost"].Value = maxEst?.ToString("C2", new System.Globalization.CultureInfo("id-ID"));
            }
            catch { }
        }

        private void DataGridView_UserDeletingRow(object sender, DataGridViewRowCancelEventArgs e)
        {
            var idCell = e.Row.Cells["Id"].Value;
            if (idCell != null && !string.IsNullOrWhiteSpace(idCell.ToString()))
                _deletedIds.Add(idCell.ToString());
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
