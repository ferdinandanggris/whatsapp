namespace WaDesktop.Client.Views
{
    partial class SidebarView
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Label labelHeader;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
                components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.labelHeader = new System.Windows.Forms.Label();
            this.panel1 = new System.Windows.Forms.Panel();
            this.tableLayoutPanel1 = new System.Windows.Forms.TableLayoutPanel();
            this.lbMarketingCount = new System.Windows.Forms.Label();
            this.lbUtilityCount = new System.Windows.Forms.Label();
            this.tbUtilityCount = new System.Windows.Forms.TextBox();
            this.tbAuthenticationCount = new System.Windows.Forms.TextBox();
            this.lbAuthenticationCount = new System.Windows.Forms.Label();
            this.tbServiceCount = new System.Windows.Forms.TextBox();
            this.tbBillMeta = new System.Windows.Forms.TextBox();
            this.lbMetaBill = new System.Windows.Forms.Label();
            this.tbMaxCost = new System.Windows.Forms.TextBox();
            this.tbMarketingCount = new System.Windows.Forms.TextBox();
            this.lbServiceCount = new System.Windows.Forms.Label();
            this.lbEstCurrentBil = new System.Windows.Forms.Label();
            this.lbEstMaxBill = new System.Windows.Forms.Label();
            this.textBox1 = new System.Windows.Forms.TextBox();
            this.panel1.SuspendLayout();
            this.tableLayoutPanel1.SuspendLayout();
            this.SuspendLayout();
            // 
            // labelHeader
            // 
            this.labelHeader.Dock = System.Windows.Forms.DockStyle.Top;
            this.labelHeader.Font = new System.Drawing.Font("Segoe UI", 10F, System.Drawing.FontStyle.Bold);
            this.labelHeader.ForeColor = System.Drawing.SystemColors.ControlText;
            this.labelHeader.Location = new System.Drawing.Point(0, 0);
            this.labelHeader.Name = "labelHeader";
            this.labelHeader.Padding = new System.Windows.Forms.Padding(12, 10, 12, 6);
            this.labelHeader.Size = new System.Drawing.Size(280, 43);
            this.labelHeader.TabIndex = 1;
            this.labelHeader.Text = "Whatsapp Client";
            this.labelHeader.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // panel1
            // 
            this.panel1.Controls.Add(this.tableLayoutPanel1);
            this.panel1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.panel1.Location = new System.Drawing.Point(0, 43);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(280, 663);
            this.panel1.TabIndex = 2;
            // 
            // tableLayoutPanel1
            // 
            this.tableLayoutPanel1.BackColor = System.Drawing.SystemColors.Control;
            this.tableLayoutPanel1.ColumnCount = 2;
            this.tableLayoutPanel1.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
            this.tableLayoutPanel1.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 50F));
            this.tableLayoutPanel1.Controls.Add(this.textBox1, 1, 6);
            this.tableLayoutPanel1.Controls.Add(this.lbEstMaxBill, 0, 6);
            this.tableLayoutPanel1.Controls.Add(this.tbMaxCost, 1, 5);
            this.tableLayoutPanel1.Controls.Add(this.lbMetaBill, 0, 5);
            this.tableLayoutPanel1.Controls.Add(this.tbBillMeta, 1, 4);
            this.tableLayoutPanel1.Controls.Add(this.lbEstCurrentBil, 0, 4);
            this.tableLayoutPanel1.Controls.Add(this.tbServiceCount, 1, 3);
            this.tableLayoutPanel1.Controls.Add(this.lbServiceCount, 0, 3);
            this.tableLayoutPanel1.Controls.Add(this.lbAuthenticationCount, 0, 2);
            this.tableLayoutPanel1.Controls.Add(this.tbAuthenticationCount, 1, 2);
            this.tableLayoutPanel1.Controls.Add(this.tbUtilityCount, 1, 1);
            this.tableLayoutPanel1.Controls.Add(this.lbUtilityCount, 0, 1);
            this.tableLayoutPanel1.Controls.Add(this.lbMarketingCount, 0, 0);
            this.tableLayoutPanel1.Controls.Add(this.tbMarketingCount, 1, 0);
            this.tableLayoutPanel1.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.tableLayoutPanel1.Location = new System.Drawing.Point(0, 510);
            this.tableLayoutPanel1.Name = "tableLayoutPanel1";
            this.tableLayoutPanel1.Padding = new System.Windows.Forms.Padding(3);
            this.tableLayoutPanel1.RowCount = 7;
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 20F));
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 20F));
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 20F));
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 20F));
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 20F));
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 20F));
            this.tableLayoutPanel1.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 20F));
            this.tableLayoutPanel1.Size = new System.Drawing.Size(280, 153);
            this.tableLayoutPanel1.TabIndex = 1;
            // 
            // lbMarketingCount
            // 
            this.lbMarketingCount.AutoSize = true;
            this.lbMarketingCount.Dock = System.Windows.Forms.DockStyle.Fill;
            this.lbMarketingCount.Location = new System.Drawing.Point(6, 3);
            this.lbMarketingCount.Name = "lbMarketingCount";
            this.lbMarketingCount.Size = new System.Drawing.Size(131, 20);
            this.lbMarketingCount.TabIndex = 0;
            this.lbMarketingCount.Text = "Pesan Marketing";
            // 
            // lbUtilityCount
            // 
            this.lbUtilityCount.AutoSize = true;
            this.lbUtilityCount.Dock = System.Windows.Forms.DockStyle.Fill;
            this.lbUtilityCount.Location = new System.Drawing.Point(6, 23);
            this.lbUtilityCount.Name = "lbUtilityCount";
            this.lbUtilityCount.Size = new System.Drawing.Size(131, 20);
            this.lbUtilityCount.TabIndex = 2;
            this.lbUtilityCount.Text = "Pesan Utilitas";
            // 
            // tbUtilityCount
            // 
            this.tbUtilityCount.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tbUtilityCount.Location = new System.Drawing.Point(140, 23);
            this.tbUtilityCount.Margin = new System.Windows.Forms.Padding(0);
            this.tbUtilityCount.Name = "tbUtilityCount";
            this.tbUtilityCount.ReadOnly = true;
            this.tbUtilityCount.Size = new System.Drawing.Size(137, 20);
            this.tbUtilityCount.TabIndex = 3;
            // 
            // tbAuthenticationCount
            // 
            this.tbAuthenticationCount.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tbAuthenticationCount.Location = new System.Drawing.Point(140, 43);
            this.tbAuthenticationCount.Margin = new System.Windows.Forms.Padding(0);
            this.tbAuthenticationCount.Name = "tbAuthenticationCount";
            this.tbAuthenticationCount.ReadOnly = true;
            this.tbAuthenticationCount.Size = new System.Drawing.Size(137, 20);
            this.tbAuthenticationCount.TabIndex = 5;
            // 
            // lbAuthenticationCount
            // 
            this.lbAuthenticationCount.AutoSize = true;
            this.lbAuthenticationCount.Dock = System.Windows.Forms.DockStyle.Fill;
            this.lbAuthenticationCount.Location = new System.Drawing.Point(6, 43);
            this.lbAuthenticationCount.Name = "lbAuthenticationCount";
            this.lbAuthenticationCount.Size = new System.Drawing.Size(131, 20);
            this.lbAuthenticationCount.TabIndex = 6;
            this.lbAuthenticationCount.Text = "Pesan Autentikasi";
            // 
            // tbServiceCount
            // 
            this.tbServiceCount.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tbServiceCount.Location = new System.Drawing.Point(140, 63);
            this.tbServiceCount.Margin = new System.Windows.Forms.Padding(0);
            this.tbServiceCount.Name = "tbServiceCount";
            this.tbServiceCount.ReadOnly = true;
            this.tbServiceCount.Size = new System.Drawing.Size(137, 20);
            this.tbServiceCount.TabIndex = 8;
            // 
            // tbBillMeta
            // 
            this.tbBillMeta.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tbBillMeta.Location = new System.Drawing.Point(140, 83);
            this.tbBillMeta.Margin = new System.Windows.Forms.Padding(0);
            this.tbBillMeta.Name = "tbBillMeta";
            this.tbBillMeta.ReadOnly = true;
            this.tbBillMeta.Size = new System.Drawing.Size(137, 20);
            this.tbBillMeta.TabIndex = 10;
            // 
            // lbMetaBill
            // 
            this.lbMetaBill.AutoSize = true;
            this.lbMetaBill.Dock = System.Windows.Forms.DockStyle.Fill;
            this.lbMetaBill.Location = new System.Drawing.Point(6, 103);
            this.lbMetaBill.Name = "lbMetaBill";
            this.lbMetaBill.Size = new System.Drawing.Size(131, 20);
            this.lbMetaBill.TabIndex = 11;
            this.lbMetaBill.Text = "Tagihan Meta";
            // 
            // tbMaxCost
            // 
            this.tbMaxCost.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tbMaxCost.Location = new System.Drawing.Point(140, 103);
            this.tbMaxCost.Margin = new System.Windows.Forms.Padding(0);
            this.tbMaxCost.Name = "tbMaxCost";
            this.tbMaxCost.ReadOnly = true;
            this.tbMaxCost.Size = new System.Drawing.Size(137, 20);
            this.tbMaxCost.TabIndex = 12;
            // 
            // tbMarketingCount
            // 
            this.tbMarketingCount.Dock = System.Windows.Forms.DockStyle.Fill;
            this.tbMarketingCount.Location = new System.Drawing.Point(140, 3);
            this.tbMarketingCount.Margin = new System.Windows.Forms.Padding(0);
            this.tbMarketingCount.Name = "tbMarketingCount";
            this.tbMarketingCount.ReadOnly = true;
            this.tbMarketingCount.Size = new System.Drawing.Size(137, 20);
            this.tbMarketingCount.TabIndex = 1;
            // 
            // lbServiceCount
            // 
            this.lbServiceCount.AutoSize = true;
            this.lbServiceCount.Dock = System.Windows.Forms.DockStyle.Fill;
            this.lbServiceCount.Location = new System.Drawing.Point(6, 63);
            this.lbServiceCount.Name = "lbServiceCount";
            this.lbServiceCount.Size = new System.Drawing.Size(131, 20);
            this.lbServiceCount.TabIndex = 7;
            this.lbServiceCount.Text = "Pesan Service";
            // 
            // lbEstCurrentBil
            // 
            this.lbEstCurrentBil.AutoSize = true;
            this.lbEstCurrentBil.Dock = System.Windows.Forms.DockStyle.Fill;
            this.lbEstCurrentBil.Location = new System.Drawing.Point(6, 83);
            this.lbEstCurrentBil.Name = "lbEstCurrentBil";
            this.lbEstCurrentBil.Size = new System.Drawing.Size(131, 20);
            this.lbEstCurrentBil.TabIndex = 9;
            this.lbEstCurrentBil.Text = "Est. Tagihan";
            // 
            // lbEstMaxBill
            // 
            this.lbEstMaxBill.AutoSize = true;
            this.lbEstMaxBill.Dock = System.Windows.Forms.DockStyle.Fill;
            this.lbEstMaxBill.Location = new System.Drawing.Point(6, 123);
            this.lbEstMaxBill.Name = "lbEstMaxBill";
            this.lbEstMaxBill.Size = new System.Drawing.Size(131, 27);
            this.lbEstMaxBill.TabIndex = 13;
            this.lbEstMaxBill.Text = "Est. Maks Tagihan";
            // 
            // textBox1
            // 
            this.textBox1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.textBox1.Location = new System.Drawing.Point(140, 123);
            this.textBox1.Margin = new System.Windows.Forms.Padding(0);
            this.textBox1.Name = "textBox1";
            this.textBox1.ReadOnly = true;
            this.textBox1.Size = new System.Drawing.Size(137, 20);
            this.textBox1.TabIndex = 14;
            // 
            // SidebarView
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.White;
            this.Controls.Add(this.panel1);
            this.Controls.Add(this.labelHeader);
            this.Name = "SidebarView";
            this.Size = new System.Drawing.Size(280, 706);
            this.panel1.ResumeLayout(false);
            this.tableLayoutPanel1.ResumeLayout(false);
            this.tableLayoutPanel1.PerformLayout();
            this.ResumeLayout(false);

        }

        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.TableLayoutPanel tableLayoutPanel1;
        private System.Windows.Forms.TextBox tbAuthenticationCount;
        private System.Windows.Forms.TextBox tbUtilityCount;
        private System.Windows.Forms.Label lbUtilityCount;
        private System.Windows.Forms.Label lbMarketingCount;
        private System.Windows.Forms.TextBox tbMaxCost;
        private System.Windows.Forms.Label lbMetaBill;
        private System.Windows.Forms.TextBox tbBillMeta;
        private System.Windows.Forms.TextBox tbServiceCount;
        private System.Windows.Forms.Label lbAuthenticationCount;
        private System.Windows.Forms.TextBox tbMarketingCount;
        private System.Windows.Forms.Label lbEstCurrentBil;
        private System.Windows.Forms.Label lbServiceCount;
        private System.Windows.Forms.TextBox textBox1;
        private System.Windows.Forms.Label lbEstMaxBill;
    }
}
