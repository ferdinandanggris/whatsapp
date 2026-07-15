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
            this.txtSearch = new System.Windows.Forms.TextBox();
            this.btnSearch = new System.Windows.Forms.Button();
            this.btnRefresh = new System.Windows.Forms.Button();
            this.btnSave = new System.Windows.Forms.Button();
            this.panelToolbar = new System.Windows.Forms.Panel();
            this.DgvId = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.DgvUsername = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.DgvName = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Role = new System.Windows.Forms.DataGridViewComboBoxColumn();
            this.Status = new System.Windows.Forms.DataGridViewCheckBoxColumn();
            this.Company = new System.Windows.Forms.DataGridViewComboBoxColumn();
            this.DgvPassword = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Reset = new System.Windows.Forms.DataGridViewButtonColumn();
            ((System.ComponentModel.ISupportInitialize)(this.dataGridView)).BeginInit();
            this.panelToolbar.SuspendLayout();
            this.SuspendLayout();
            // 
            // dataGridView
            // 
            this.dataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.dataGridView.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.DgvId,
            this.DgvUsername,
            this.DgvName,
            this.Role,
            this.Status,
            this.Company,
            this.DgvPassword,
            this.Reset});
            this.dataGridView.Dock = System.Windows.Forms.DockStyle.Fill;
            this.dataGridView.EditMode = System.Windows.Forms.DataGridViewEditMode.EditOnEnter;
            this.dataGridView.Location = new System.Drawing.Point(0, 40);
            this.dataGridView.Name = "dataGridView";
            this.dataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
            this.dataGridView.Size = new System.Drawing.Size(1000, 666);
            this.dataGridView.TabIndex = 0;
            this.dataGridView.CellBeginEdit += new System.Windows.Forms.DataGridViewCellCancelEventHandler(this.DataGridView_CellBeginEdit);
            this.dataGridView.CellContentClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.DataGridView_CellContentClick);
            this.dataGridView.CellEndEdit += new System.Windows.Forms.DataGridViewCellEventHandler(this.DataGridView_CellEndEdit);
            this.dataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(this.DataGridView_DataError);
            this.dataGridView.UserDeletingRow += new System.Windows.Forms.DataGridViewRowCancelEventHandler(this.DataGridView_UserDeletingRow);
            // 
            // txtSearch
            // 
            this.txtSearch.Location = new System.Drawing.Point(8, 10);
            this.txtSearch.Name = "txtSearch";
            this.txtSearch.Size = new System.Drawing.Size(200, 20);
            this.txtSearch.TabIndex = 3;
            this.txtSearch.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.txtSearch_KeyPress);
            // 
            // btnSearch
            // 
            this.btnSearch.Location = new System.Drawing.Point(214, 8);
            this.btnSearch.Name = "btnSearch";
            this.btnSearch.Size = new System.Drawing.Size(75, 23);
            this.btnSearch.TabIndex = 2;
            this.btnSearch.Text = "Search";
            this.btnSearch.UseVisualStyleBackColor = true;
            this.btnSearch.Click += new System.EventHandler(this.btnSearch_Click);
            // 
            // btnRefresh
            // 
            this.btnRefresh.Location = new System.Drawing.Point(295, 8);
            this.btnRefresh.Name = "btnRefresh";
            this.btnRefresh.Size = new System.Drawing.Size(75, 23);
            this.btnRefresh.TabIndex = 1;
            this.btnRefresh.Text = "Refresh";
            this.btnRefresh.UseVisualStyleBackColor = true;
            this.btnRefresh.Click += new System.EventHandler(this.btnRefresh_Click);
            // 
            // btnSave
            // 
            this.btnSave.Location = new System.Drawing.Point(376, 8);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(75, 23);
            this.btnSave.TabIndex = 0;
            this.btnSave.Text = "Save";
            this.btnSave.UseVisualStyleBackColor = true;
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click);
            // 
            // panelToolbar
            // 
            this.panelToolbar.Controls.Add(this.btnSave);
            this.panelToolbar.Controls.Add(this.btnRefresh);
            this.panelToolbar.Controls.Add(this.btnSearch);
            this.panelToolbar.Controls.Add(this.txtSearch);
            this.panelToolbar.Dock = System.Windows.Forms.DockStyle.Top;
            this.panelToolbar.Location = new System.Drawing.Point(0, 0);
            this.panelToolbar.Name = "panelToolbar";
            this.panelToolbar.Padding = new System.Windows.Forms.Padding(8);
            this.panelToolbar.Size = new System.Drawing.Size(1000, 40);
            this.panelToolbar.TabIndex = 1;
            // 
            // DgvId
            // 
            this.DgvId.DataPropertyName = "Id";
            this.DgvId.HeaderText = "ID";
            this.DgvId.Name = "DgvId";
            // 
            // DgvUsername
            // 
            this.DgvUsername.DataPropertyName = "Username";
            this.DgvUsername.HeaderText = "Username";
            this.DgvUsername.Name = "DgvUsername";
            // 
            // DgvName
            // 
            this.DgvName.DataPropertyName = "Name";
            this.DgvName.HeaderText = "Name";
            this.DgvName.Name = "DgvName";
            // 
            // Role
            // 
            this.Role.HeaderText = "Role";
            this.Role.Items.AddRange(new object[] {
            "super_admin",
            "admin",
            "cs"});
            this.Role.Name = "Role";
            // 
            // Status
            // 
            this.Status.FalseValue = false;
            this.Status.HeaderText = "Active";
            this.Status.Name = "Status";
            this.Status.TrueValue = true;
            // 
            // Company
            // 
            this.Company.HeaderText = "Server";
            this.Company.Name = "Company";
            // 
            // DgvPassword
            // 
            this.DgvPassword.DataPropertyName = "password";
            this.DgvPassword.HeaderText = "Password";
            this.DgvPassword.Name = "DgvPassword";
            // 
            // Reset
            // 
            this.Reset.HeaderText = "Reset";
            this.Reset.Name = "Reset";
            this.Reset.ReadOnly = true;
            this.Reset.Text = "Reset";
            this.Reset.UseColumnTextForButtonValue = true;
            this.Reset.Visible = false;
            // 
            // UsersView
            // 
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

        private System.Windows.Forms.DataGridViewTextBoxColumn DgvId;
        private System.Windows.Forms.DataGridViewTextBoxColumn DgvUsername;
        private System.Windows.Forms.DataGridViewTextBoxColumn DgvName;
        private System.Windows.Forms.DataGridViewComboBoxColumn Role;
        private System.Windows.Forms.DataGridViewCheckBoxColumn Status;
        private System.Windows.Forms.DataGridViewComboBoxColumn Company;
        private System.Windows.Forms.DataGridViewTextBoxColumn DgvPassword;
        private System.Windows.Forms.DataGridViewButtonColumn Reset;
    }
}
