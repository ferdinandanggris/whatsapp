namespace WaDesktop.Client.Views.ManagementViews
{
    partial class AppSettingsView
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Label labelWebhook;
        private System.Windows.Forms.TextBox txtWebhookUrl;
        private System.Windows.Forms.Label labelApiKey;
        private System.Windows.Forms.TextBox txtApiKey;
        private System.Windows.Forms.Label labelWabaId;
        private System.Windows.Forms.TextBox txtWabaId;
        private System.Windows.Forms.Label labelAppId;
        private System.Windows.Forms.TextBox txtAppId;
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
            this.labelWebhook = new System.Windows.Forms.Label();
            this.txtWebhookUrl = new System.Windows.Forms.TextBox();
            this.labelApiKey = new System.Windows.Forms.Label();
            this.txtApiKey = new System.Windows.Forms.TextBox();
            this.labelWabaId = new System.Windows.Forms.Label();
            this.txtWabaId = new System.Windows.Forms.TextBox();
            this.labelAppId = new System.Windows.Forms.Label();
            this.txtAppId = new System.Windows.Forms.TextBox();
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
            this.tableLayout.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 30.20833F));
            this.tableLayout.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 69.79166F));
            this.tableLayout.Controls.Add(this.labelWebhook, 0, 0);
            this.tableLayout.Controls.Add(this.txtWebhookUrl, 1, 0);
            this.tableLayout.Controls.Add(this.labelApiKey, 0, 1);
            this.tableLayout.Controls.Add(this.txtApiKey, 1, 1);
            this.tableLayout.Controls.Add(this.labelWabaId, 0, 2);
            this.tableLayout.Controls.Add(this.txtWabaId, 1, 2);
            this.tableLayout.Controls.Add(this.labelAppId, 0, 3);
            this.tableLayout.Controls.Add(this.txtAppId, 1, 3);
            this.tableLayout.Controls.Add(this.flowPanel, 1, 4);
            this.tableLayout.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tableLayout.Location = new System.Drawing.Point(0, 0);
            this.tableLayout.Name = "tableLayout";
            this.tableLayout.Padding = new System.Windows.Forms.Padding(20);
            this.tableLayout.RowCount = 6;
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 25F));
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 26F));
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 27F));
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 27F));
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 42F));
            this.tableLayout.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 36F));
            this.tableLayout.Size = new System.Drawing.Size(1000, 706);
            this.tableLayout.TabIndex = 0;
            // 
            // labelWebhook
            // 
            this.labelWebhook.Dock = System.Windows.Forms.DockStyle.Fill;
            this.labelWebhook.Location = new System.Drawing.Point(23, 20);
            this.labelWebhook.Name = "labelWebhook";
            this.labelWebhook.Size = new System.Drawing.Size(284, 25);
            this.labelWebhook.TabIndex = 0;
            this.labelWebhook.Text = "Webhook URL:";
            this.labelWebhook.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // txtWebhookUrl
            // 
            this.txtWebhookUrl.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtWebhookUrl.Location = new System.Drawing.Point(313, 23);
            this.txtWebhookUrl.Name = "txtWebhookUrl";
            this.txtWebhookUrl.Size = new System.Drawing.Size(664, 20);
            this.txtWebhookUrl.TabIndex = 1;
            // 
            // labelApiKey
            // 
            this.labelApiKey.Location = new System.Drawing.Point(23, 45);
            this.labelApiKey.Name = "labelApiKey";
            this.labelApiKey.Size = new System.Drawing.Size(100, 20);
            this.labelApiKey.TabIndex = 2;
            this.labelApiKey.Text = "API Key:";
            this.labelApiKey.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // txtApiKey
            // 
            this.txtApiKey.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtApiKey.Location = new System.Drawing.Point(313, 48);
            this.txtApiKey.Name = "txtApiKey";
            this.txtApiKey.Size = new System.Drawing.Size(664, 20);
            this.txtApiKey.TabIndex = 3;
            this.txtApiKey.UseSystemPasswordChar = true;
            // 
            // labelWabaId
            // 
            this.labelWabaId.Location = new System.Drawing.Point(23, 71);
            this.labelWabaId.Name = "labelWabaId";
            this.labelWabaId.Size = new System.Drawing.Size(100, 20);
            this.labelWabaId.TabIndex = 4;
            this.labelWabaId.Text = "WABA ID:";
            this.labelWabaId.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // txtWabaId
            this.txtWabaId.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtWabaId.Location = new System.Drawing.Point(313, 74);
            this.txtWabaId.Name = "txtWabaId";
            this.txtWabaId.Size = new System.Drawing.Size(664, 20);
            this.txtWabaId.TabIndex = 5;
            // 
            // labelAppId
            this.labelAppId.Location = new System.Drawing.Point(23, 98);
            this.labelAppId.Name = "labelAppId";
            this.labelAppId.Size = new System.Drawing.Size(100, 20);
            this.labelAppId.TabIndex = 6;
            this.labelAppId.Text = "App ID:";
            this.labelAppId.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            // 
            // txtAppId
            this.txtAppId.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtAppId.Location = new System.Drawing.Point(313, 101);
            this.txtAppId.Name = "txtAppId";
            this.txtAppId.Size = new System.Drawing.Size(664, 20);
            this.txtAppId.TabIndex = 7;
            // 
            // flowPanel
            // 
            this.flowPanel.Controls.Add(this.btnSave);
            this.flowPanel.Controls.Add(this.btnRefresh);
            this.flowPanel.Dock = System.Windows.Forms.DockStyle.Fill;
            this.flowPanel.Location = new System.Drawing.Point(313, 128);
            this.flowPanel.Name = "flowPanel";
            this.flowPanel.Size = new System.Drawing.Size(664, 36);
            this.flowPanel.TabIndex = 6;
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
            this.Size = new System.Drawing.Size(1000, 706);
            this.tableLayout.ResumeLayout(false);
            this.tableLayout.PerformLayout();
            this.flowPanel.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        private System.Windows.Forms.FlowLayoutPanel flowPanel;
    }
}
