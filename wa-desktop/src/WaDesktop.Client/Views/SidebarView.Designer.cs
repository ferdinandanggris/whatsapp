namespace WaDesktop.Client.Views
{
    partial class SidebarView
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.TreeView treeView;
        private System.Windows.Forms.Label labelHeader;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
                components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.treeView = new System.Windows.Forms.TreeView();
            this.labelHeader = new System.Windows.Forms.Label();
            this.SuspendLayout();

            // labelHeader
            this.labelHeader.Dock = System.Windows.Forms.DockStyle.Top;
            this.labelHeader.Font = new System.Drawing.Font("Segoe UI", 10F, System.Drawing.FontStyle.Bold);
            this.labelHeader.ForeColor = System.Drawing.Color.FromArgb(0x07, 0x5E, 0x54);
            this.labelHeader.Location = new System.Drawing.Point(0, 0);
            this.labelHeader.Name = "labelHeader";
            this.labelHeader.Padding = new System.Windows.Forms.Padding(12, 10, 12, 6);
            this.labelHeader.Size = new System.Drawing.Size(280, 32);
            this.labelHeader.Text = "WA Phone Numbers";
            this.labelHeader.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;

            // treeView
            this.treeView.Dock = System.Windows.Forms.DockStyle.Fill;
            this.treeView.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.treeView.FullRowSelect = true;
            this.treeView.HideSelection = false;
            this.treeView.Location = new System.Drawing.Point(0, 32);
            this.treeView.Name = "treeView";
            this.treeView.Size = new System.Drawing.Size(280, 674);
            this.treeView.TabIndex = 0;
            this.treeView.BorderStyle = System.Windows.Forms.BorderStyle.None;

            // SidebarView
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.White;
            this.Controls.Add(this.treeView);
            this.Controls.Add(this.labelHeader);
            this.Name = "SidebarView";
            this.Size = new System.Drawing.Size(280, 706);
            this.ResumeLayout(false);
        }
    }
}
