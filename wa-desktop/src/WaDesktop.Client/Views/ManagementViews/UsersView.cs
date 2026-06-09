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
    public partial class UsersView : UserControl, IManagementView<User>
    {
        private static readonly Dictionary<string, string> RoleMap = new Dictionary<string, string>()
        {
            ["super_admin"] = "super_admin",
            ["company_admin"] = "admin",
            ["agent"] = "agent"
        };

        private static readonly Dictionary<string, string> RoleReverseMap = new Dictionary<string, string>()
        {
            ["super_admin"] = "super_admin",
            ["admin"] = "company_admin",
            ["agent"] = "agent"
        };

        private readonly HashSet<string> _deletedIds = new HashSet<string>();
        private readonly Dictionary<(int Row, int Col), object> _originalValues = new Dictionary<(int Row, int Col), object>();
        private List<Company> _companies = new List<Company>();

        public UsersView()
        {
            InitializeComponent();
        }

        // ── IManagementView ──

        public IList<User> DataSource
        {
            set
            {
                this.InvokeIfRequired(() =>
                {
                    _deletedIds.Clear();
                    _originalValues.Clear();
                    dataGridView.Rows.Clear();
                    foreach (var u in value)
                    {
                        string displayRole = RoleMap.TryGetValue(u.Role ?? "", out var r) ? r : u.Role;

                        int idx = dataGridView.Rows.Add(u.Id, u.Email, u.DisplayName, displayRole, u.IsActive, u.CompanyId);
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
        public event EventHandler<string> ResetPasswordClicked;

        // ── Company ComboBox ──

        public void SetCompanies(IList<Company> companies)
        {
            _companies = companies.ToList();
            this.InvokeIfRequired(() =>
            {
                colCompany.Items.Clear();
                foreach (var c in companies)
                    colCompany.Items.Add(c);
                colCompany.DisplayMember = "Name";
                colCompany.ValueMember = "Id";
            });
        }

        // ── Yellow Highlight ──

        private void MarkDirty(DataGridViewRow row)
        {
            if (row == null || row.IsNewRow) return;
            row.DefaultCellStyle.BackColor = Color.LightYellow;
            row.Tag = true;
        }

        public IList<User> GetModifiedRows()
        {
            var list = new List<User>();
            foreach (DataGridViewRow row in dataGridView.Rows)
            {
                if (row.IsNewRow) continue;
                if (row.Tag != null && (bool)row.Tag)
                {
                    string displayRole = row.Cells["Role"].Value?.ToString() ?? "";
                    string backendRole = RoleReverseMap.TryGetValue(displayRole, out var r) ? r : displayRole;

                    list.Add(new User
                    {
                        Id = row.Cells["Id"].Value?.ToString() ?? "",
                        Email = row.Cells["Email"].Value?.ToString() ?? "",
                        DisplayName = row.Cells["Name"].Value?.ToString() ?? "",
                        Role = backendRole,
                        CompanyId = row.Cells["Company"].Value as long?,
                        IsActive = row.Cells["Status"].Value as bool? ?? false
                    });
                }
            }
            return list;
        }

        public IList<string> GetDeletedIds() => _deletedIds.ToList();

        // ── Event Handlers ──

        private void DataGridView_CellBeginEdit(object sender, DataGridViewCellCancelEventArgs e)
        {
            // Don't track original for button column
            if (dataGridView.Columns[e.ColumnIndex].Name == "Reset") return;

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

        private void DataGridView_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.ColumnIndex < 0 || e.RowIndex < 0) return;
            if (dataGridView.Columns[e.ColumnIndex].Name != "Reset") return;

            var userId = dataGridView.Rows[e.RowIndex].Cells["Id"].Value?.ToString();
            if (string.IsNullOrEmpty(userId)) return;

            ResetPasswordClicked?.Invoke(this, userId);
        }

        private void DataGridView_UserDeletingRow(object sender, DataGridViewRowCancelEventArgs e)
        {
            var idCell = e.Row.Cells["Id"].Value?.ToString();
            if (!string.IsNullOrEmpty(idCell))
                _deletedIds.Add(idCell);
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
