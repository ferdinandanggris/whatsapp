namespace WaDesktop.Client.Views
{
    partial class LoginView
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.TextBox txtUsername;
        private System.Windows.Forms.TextBox txtPassword;
        private System.Windows.Forms.Button btnLogin;
        private System.Windows.Forms.Label labelTitle;
        private System.Windows.Forms.Label labelUser;
        private System.Windows.Forms.Label labelPass;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null)) components.Dispose();
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.labelTitle = new System.Windows.Forms.Label();
            this.labelUser = new System.Windows.Forms.Label();
            this.txtUsername = new System.Windows.Forms.TextBox();
            this.labelPass = new System.Windows.Forms.Label();
            this.txtPassword = new System.Windows.Forms.TextBox();
            this.btnLogin = new System.Windows.Forms.Button();
            this.SuspendLayout();

            this.labelTitle.AutoSize = true;
            this.labelTitle.Font = new System.Drawing.Font("Segoe UI", 16F, System.Drawing.FontStyle.Bold);
            this.labelTitle.ForeColor = System.Drawing.Color.FromArgb(0x07, 0x5E, 0x54);
            this.labelTitle.Location = new System.Drawing.Point(120, 40);
            this.labelTitle.Text = "WA Desktop — Login";

            this.labelUser.Location = new System.Drawing.Point(60, 100);
            this.labelUser.Size = new System.Drawing.Size(80, 20);
            this.labelUser.Text = "Username:";

            this.txtUsername.Location = new System.Drawing.Point(150, 98);
            this.txtUsername.Size = new System.Drawing.Size(220, 22);

            this.labelPass.Location = new System.Drawing.Point(60, 140);
            this.labelPass.Size = new System.Drawing.Size(80, 20);
            this.labelPass.Text = "Password:";

            this.txtPassword.Location = new System.Drawing.Point(150, 138);
            this.txtPassword.Size = new System.Drawing.Size(220, 22);
            this.txtPassword.UseSystemPasswordChar = true;
            this.txtPassword.KeyPress += new System.Windows.Forms.KeyPressEventHandler(this.txtPassword_KeyPress);

            this.btnLogin.Location = new System.Drawing.Point(150, 180);
            this.btnLogin.Size = new System.Drawing.Size(100, 32);
            this.btnLogin.Text = "Login";
            this.btnLogin.UseVisualStyleBackColor = true;
            this.btnLogin.Click += new System.EventHandler(this.btnLogin_Click);

            this.AcceptButton = this.btnLogin;
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(434, 261);
            this.Controls.Add(this.btnLogin);
            this.Controls.Add(this.txtPassword);
            this.Controls.Add(this.labelPass);
            this.Controls.Add(this.txtUsername);
            this.Controls.Add(this.labelUser);
            this.Controls.Add(this.labelTitle);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "LoginView";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Login — WA Desktop";
            this.ResumeLayout(false);
            this.PerformLayout();
        }
    }
}
