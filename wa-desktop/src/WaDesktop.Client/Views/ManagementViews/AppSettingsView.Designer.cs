namespace WaDesktop.Client.Views.ManagementViews
{
    partial class AppSettingsView
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Label labelWabaToken;
        private System.Windows.Forms.TextBox txtWabaToken;
        private System.Windows.Forms.Label labelAppId;
        private System.Windows.Forms.TextBox txtAppId;
        private System.Windows.Forms.Label labelBusinessId;
        private System.Windows.Forms.TextBox txtBusinessId;
        private System.Windows.Forms.Label labelVerifyToken;
        private System.Windows.Forms.TextBox txtVerifyToken;
        private System.Windows.Forms.Button btnSave;
        private System.Windows.Forms.Button btnRefresh;
        private System.Windows.Forms.TableLayoutPanel tableLayout;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null)) components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.tableLayout = new System.Windows.Forms.TableLayoutPanel();
            this.labelWabaToken = new System.Windows.Forms.Label();
            this.txtWabaToken = new System.Windows.Forms.TextBox();
            this.labelAppId = new System.Windows.Forms.Label();
            this.txtAppId = new System.Windows.Forms.TextBox();
            this.labelBusinessId = new System.Windows.Forms.Label();
            this.txtBusinessId = new System.Windows.Forms.TextBox();
            this.labelVerifyToken = new System.Windows.Forms.Label();
            this.txtVerifyToken = new System.Windows.Forms.TextBox();
            this.flowPanel = new System.Windows.Forms.FlowLayoutPanel();
            this.btnSave = new System.Windows.Forms.Button();
            this.btnRefresh = new System.Windows.Forms.Button();
            this.tableLayout.SuspendLayout();
            this.flowPanel.SuspendLayout();
            this.SuspendLayout();
            // 
            // tableLayout
            // 
            this.tableLayout.ColumnCount = 2;
            this.tableLayout.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 30F));
            this.tableLayout.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 70F));
            this.tableLayout.Controls.Add(this.labelWabaToken, 0, 0);
            this.tableLayout.Controls.Add(this.txtWabaToken, 1, 0);
            this.tableLayout.Controls.Add(this.labelAppId, 0, 1);
            this.tableLayout.Controls.Add(this.txtAppId, 1, 1);
            this.tableLayout.Controls.Add(this.labelBusinessId, 0, 2);
            this.tableLayout.Controls.Add(this.txtBusinessId, 1, 2);
            this.tableLayout.Controls.Add(this.labelVerifyToken, 0, 3);
            this.tableLayout.Controls.Add(this.txtVerifyToken, 1, 3);
            this.tableLayout.Controls.Add(this.flowPanel, 1, 4);
            this.tableLayout.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tableLayout.Location = new System.Drawing.Point(0, 0);
            this.tableLayout.Name = "tableLayout";
            this.tableLayout.Padding = new System.Windows.Forms.Padding(20);
            this.tableLayout.RowCount = 6;
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 30F));
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 30F));
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 30F));
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 30F));
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 42F));
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 36F));
            this.tableLayout.Size = new System.Drawing.Size(600, 250);
            this.tableLayout.TabIndex = 0;
            // 
            // labelWabaToken
            // 
            this.labelWabaToken.Dock = System.Windows.Forms.DockStyle.Fill;
            this.labelWabaToken.Location = new System.Drawing.Point(23, 20);
            this.labelWabaToken.Name = "labelWabaToken";
            this.labelWabaToken.Size = new System.Drawing.Size(162, 30);
            this.labelWabaToken.TabIndex = 0;
            this.labelWabaToken.Text = "WABA Token:";
            this.labelWabaToken.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // txtWabaToken
            // 
            this.txtWabaToken.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtWabaToken.Location = new System.Drawing.Point(191, 23);
            this.txtWabaToken.Name = "txtWabaToken";
            this.txtWabaToken.Size = new System.Drawing.Size(386, 20);
            this.txtWabaToken.TabIndex = 1;
            this.txtWabaToken.UseSystemPasswordChar = true;
            // 
            // labelAppId
            // 
            this.labelAppId.Dock = System.Windows.Forms.DockStyle.Fill;
            this.labelAppId.Location = new System.Drawing.Point(23, 50);
            this.labelAppId.Name = "labelAppId";
            this.labelAppId.Size = new System.Drawing.Size(162, 30);
            this.labelAppId.TabIndex = 2;
            this.labelAppId.Text = "App ID:";
            this.labelAppId.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // txtAppId
            // 
            this.txtAppId.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtAppId.Location = new System.Drawing.Point(191, 53);
            this.txtAppId.Name = "txtAppId";
            this.txtAppId.Size = new System.Drawing.Size(386, 20);
            this.txtAppId.TabIndex = 3;
            // 
            // labelBusinessId
            // 
            this.labelBusinessId.Dock = System.Windows.Forms.DockStyle.Fill;
            this.labelBusinessId.Location = new System.Drawing.Point(23, 80);
            this.labelBusinessId.Name = "labelBusinessId";
            this.labelBusinessId.Size = new System.Drawing.Size(162, 30);
            this.labelBusinessId.TabIndex = 4;
            this.labelBusinessId.Text = "Business ID:";
            this.labelBusinessId.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // txtBusinessId
            // 
            this.txtBusinessId.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtBusinessId.Location = new System.Drawing.Point(191, 83);
            this.txtBusinessId.Name = "txtBusinessId";
            this.txtBusinessId.Size = new System.Drawing.Size(386, 20);
            this.txtBusinessId.TabIndex = 5;
            // 
            // labelVerifyToken
            // 
            this.labelVerifyToken.Dock = System.Windows.Forms.DockStyle.Fill;
            this.labelVerifyToken.Location = new System.Drawing.Point(23, 110);
            this.labelVerifyToken.Name = "labelVerifyToken";
            this.labelVerifyToken.Size = new System.Drawing.Size(162, 30);
            this.labelVerifyToken.TabIndex = 6;
            this.labelVerifyToken.Text = "Verify Token:";
            this.labelVerifyToken.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // txtVerifyToken
            // 
            this.txtVerifyToken.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtVerifyToken.Location = new System.Drawing.Point(191, 113);
            this.txtVerifyToken.Name = "txtVerifyToken";
            this.txtVerifyToken.Size = new System.Drawing.Size(386, 20);
            this.txtVerifyToken.TabIndex = 7;
            // 
            // flowPanel
            // 
            this.flowPanel.Controls.Add(this.btnSave);
            this.flowPanel.Controls.Add(this.btnRefresh);
            this.flowPanel.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowPanel.Location = new System.Drawing.Point(191, 143);
            this.flowPanel.Name = "flowPanel";
            this.flowPanel.Size = new System.Drawing.Size(386, 36);
            this.flowPanel.TabIndex = 8;
            // 
            // btnSave
            // 
            this.btnSave.Location = new System.Drawing.Point(3, 3);
            this.btnSave.Name = "btnSave";
            this.btnSave.Size = new System.Drawing.Size(100, 30);
            this.btnSave.TabIndex = 0;
            this.btnSave.Text = "Save";
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click);
            // 
            // btnRefresh
            // 
            this.btnRefresh.Location = new System.Drawing.Point(109, 3);
            this.btnRefresh.Name = "btnRefresh";
            this.btnRefresh.Size = new System.Drawing.Size(100, 30);
            this.btnRefresh.TabIndex = 1;
            this.btnRefresh.Text = "Refresh";
            this.btnRefresh.Click += new System.EventHandler(this.btnRefresh_Click);
            // 
            // AppSettingsView
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.tableLayout);
            this.Name = "AppSettingsView";
            this.Size = new System.Drawing.Size(600, 250);
            this.tableLayout.ResumeLayout(false);
            this.tableLayout.PerformLayout();
            this.flowPanel.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        private System.Windows.Forms.FlowLayoutPanel flowPanel;
    }
}