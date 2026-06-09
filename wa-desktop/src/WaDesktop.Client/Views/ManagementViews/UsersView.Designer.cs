namespace WaDesktop.Client.Views.ManagementViews
{
    partial class UsersView
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.DataGridView dataGridView;
        private System.Windows.Forms.DataGridViewComboBoxColumn colCompany;
        private System.Windows.Forms.DataGridViewComboBoxColumn colRole;
        private System.Windows.Forms.DataGridViewCheckBoxColumn colStatus;
        private System.Windows.Forms.DataGridViewButtonColumn colReset;
        private System.Windows.Forms.TextBox txtSearch;
        private System.Windows.Forms.Button btnSearch;
        private System.Windows.Forms.Button btnRefresh;
        private System.Windows.Forms.Button btnSave;
        private System.Windows.Forms.Panel panelToolbar;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null)) components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.dataGridView = new System.Windows.Forms.DataGridView();
            this.colCompany = new System.Windows.Forms.DataGridViewComboBoxColumn();
            this.colRole = new System.Windows.Forms.DataGridViewComboBoxColumn();
            this.colStatus = new System.Windows.Forms.DataGridViewCheckBoxColumn();
            this.colReset = new System.Windows.Forms.DataGridViewButtonColumn();
            this.txtSearch = new System.Windows.Forms.TextBox();
            this.btnSearch = new System.Windows.Forms.Button();
            this.btnRefresh = new System.Windows.Forms.Button();
            this.btnSave = new System.Windows.Forms.Button();
            this.panelToolbar = new System.Windows.Forms.Panel();
            ((System.ComponentModel.ISupportInitialize)(this.dataGridView)).BeginInit();
            this.panelToolbar.SuspendLayout();
            this.SuspendLayout();

            // dataGridView
            this.dataGridView.AllowUserToAddRows = true;
            this.dataGridView.AllowUserToDeleteRows = true;
            this.dataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.dataGridView.Dock = System.Windows.Forms.DockStyle.Fill;
            this.dataGridView.EditMode = System.Windows.Forms.DataGridViewEditMode.EditOnEnter;
            this.dataGridView.Location = new System.Drawing.Point(0, 40);
            this.dataGridView.Name = "dataGridView";
            this.dataGridView.ReadOnly = false;
            this.dataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
            this.dataGridView.Size = new System.Drawing.Size(1000, 666);
            this.dataGridView.TabIndex = 0;

            // Columns
            this.dataGridView.Columns.Add("Id", "ID");
            this.dataGridView.Columns.Add("Email", "Email");
            this.dataGridView.Columns.Add("Name", "Name");
            this.dataGridView.Columns.Add(this.colRole);
            this.dataGridView.Columns.Add(this.colStatus);
            this.dataGridView.Columns.Add(this.colCompany);
            this.dataGridView.Columns.Add(this.colReset);
            this.dataGridView.Columns["Id"].ReadOnly = true;

            // colRole
            this.colRole.HeaderText = "Role";
            this.colRole.Name = "Role";
            this.colRole.Items.AddRange(new object[] { "super_admin", "admin", "agent" });
            this.colRole.DisplayStyle = System.Windows.Forms.DataGridViewComboBoxDisplayStyle.DropDownButton;

            // colStatus
            this.colStatus.HeaderText = "Active";
            this.colStatus.Name = "Status";
            this.colStatus.TrueValue = true;
            this.colStatus.FalseValue = false;

            // colCompany
            this.colCompany.HeaderText = "Company";
            this.colCompany.Name = "Company";
            this.colCompany.DisplayStyle = System.Windows.Forms.DataGridViewComboBoxDisplayStyle.DropDownButton;

            // colReset
            this.colReset.HeaderText = "Reset";
            this.colReset.Name = "Reset";
            this.colReset.Text = "Reset";
            this.colReset.UseColumnTextForButtonValue = true;
            this.colReset.ReadOnly = true;

            // Events
            this.dataGridView.CellBeginEdit += new System.Windows.Forms.DataGridViewCellCancelEventHandler(this.DataGridView_CellBeginEdit);
            this.dataGridView.CellEndEdit += new System.Windows.Forms.DataGridViewCellEventHandler(this.DataGridView_CellEndEdit);
            this.dataGridView.CellContentClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.DataGridView_CellContentClick);
            this.dataGridView.UserDeletingRow += new System.Windows.Forms.DataGridViewRowCancelEventHandler(this.DataGridView_UserDeletingRow);

            // panelToolbar
            this.panelToolbar.Controls.Add(this.btnSave);
            this.panelToolbar.Controls.Add(this.btnRefresh);
            this.panelToolbar.Controls.Add(this.btnSearch);
            this.panelToolbar.Controls.Add(this.txtSearch);
            this.panelToolbar.Dock = System.Windows.Forms.DockStyle.Top;
            this.panelToolbar.Location = new System.Drawing.Point(0, 0);
            this.panelToolbar.Name = "panelToolbar";
            this.panelToolbar.Padding = new System.Windows.Forms.Padding(8);
            this.panelToolbar.Size = new System.Drawing.Size(1000, 40);

            this.txtSearch.Location = new System.Drawing.Point(8, 10);
            this.txtSearch.Name = "txtSearch";
            this.txtSearch.Size = new System.Drawing.Size(200, 20);
            this.txtSearch.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.txtSearch_KeyPress);
            this.btnSearch.Location = new System.Drawing.Point(214, 8); this.btnSearch.Text = "Search"; this.btnSearch.UseVisualStyleBackColor = true; this.btnSearch.Click += new System.EventHandler(this.btnSearch_Click);
            this.btnRefresh.Location = new System.Drawing.Point(295, 8); this.btnRefresh.Text = "Refresh"; this.btnRefresh.UseVisualStyleBackColor = true; this.btnRefresh.Click += new System.EventHandler(this.btnRefresh_Click);
            this.btnSave.Location = new System.Drawing.Point(376, 8); this.btnSave.Text = "Save"; this.btnSave.UseVisualStyleBackColor = true; this.btnSave.Click += new System.EventHandler(this.btnSave_Click);

            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.dataGridView);
            this.Controls.Add(this.panelToolbar);
            this.Name = "UsersView";
            this.Size = new System.Drawing.Size(1000, 706);
            ((System.ComponentModel.ISupportInitialize)(this.dataGridView)).EndInit();
            this.panelToolbar.ResumeLayout(false);
            this.panelToolbar.PerformLayout();
            this.ResumeLayout(false);
        }
    }
}
