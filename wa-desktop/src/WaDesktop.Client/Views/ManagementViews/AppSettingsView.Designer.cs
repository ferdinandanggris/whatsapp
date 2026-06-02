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
            this.btnSave = new System.Windows.Forms.Button();
            this.btnRefresh = new System.Windows.Forms.Button();
            this.tableLayout.SuspendLayout();
            this.SuspendLayout();

            // tableLayout
            this.tableLayout.ColumnCount = 2;
            this.tableLayout.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 30F));
            this.tableLayout.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 70F));
            this.tableLayout.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tableLayout.Location = new System.Drawing.Point(20, 20);
            this.tableLayout.Name = "tableLayout";
            this.tableLayout.Padding = new System.Windows.Forms.Padding(20);
            this.tableLayout.RowCount = 5;
            this.tableLayout.Size = new System.Drawing.Size(960, 666);

            // Row 0: Webhook
            this.labelWebhook.Text = "Webhook URL:"; this.labelWebhook.Dock = System.Windows.Forms.DockStyle.Fill;
            this.labelWebhook.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.tableLayout.Controls.Add(this.labelWebhook, 0, 0);
            this.txtWebhookUrl.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tableLayout.Controls.Add(this.txtWebhookUrl, 1, 0);

            // Row 1: API Key
            this.labelApiKey.Text = "API Key:"; this.labelApiKey.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.tableLayout.Controls.Add(this.labelApiKey, 0, 1);
            this.txtApiKey.Dock = System.Windows.Forms.DockStyle.Fill;
            this.txtApiKey.UseSystemPasswordChar = true;
            this.tableLayout.Controls.Add(this.txtApiKey, 1, 1);

            // Row 2: WABA ID
            this.labelWabaId.Text = "WABA ID:"; this.labelWabaId.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.tableLayout.Controls.Add(this.labelWabaId, 0, 2);
            this.txtWabaId.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tableLayout.Controls.Add(this.txtWabaId, 1, 2);

            // Row 3: Buttons
            var flowPanel = new System.Windows.Forms.FlowLayoutPanel();
            flowPanel.Dock = System.Windows.Forms.DockStyle.Fill;
            flowPanel.FlowDirection = System.Windows.Forms.FlowDirection.LeftToRight;
            this.btnSave.Text = "Save";
            this.btnSave.Size = new System.Drawing.Size(100, 30);
            this.btnSave.Click += new System.EventHandler(this.btnSave_Click);
            flowPanel.Controls.Add(this.btnSave);
            this.btnRefresh.Text = "Refresh";
            this.btnRefresh.Size = new System.Drawing.Size(100, 30);
            this.btnRefresh.Click += new System.EventHandler(this.btnRefresh_Click);
            flowPanel.Controls.Add(this.btnRefresh);
            this.tableLayout.Controls.Add(flowPanel, 1, 3);

            // AppSettingsView
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.tableLayout);
            this.Name = "AppSettingsView";
            this.Size = new System.Drawing.Size(1000, 706);
            this.tableLayout.ResumeLayout(false);
            this.tableLayout.PerformLayout();
            this.ResumeLayout(false);
        }
    }
}
