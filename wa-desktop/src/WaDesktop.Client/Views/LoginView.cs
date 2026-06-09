using System;
using System.Windows.Forms;
using WaDesktop.Client.Presenters;

namespace WaDesktop.Client.Views
{
    public partial class LoginView : Form, ILoginView
    {
        public LoginView()
        {
            InitializeComponent();
        }

        public string Username => txtUsername.Text.Trim();
        public string Password => txtPassword.Text;

        public bool IsLoading
        {
            set
            {
                btnLogin.Enabled = !value;
                Cursor = value ? Cursors.WaitCursor : Cursors.Default;
            }
        }

        public event EventHandler LoginClicked;
        public void ShowError(string message) => MessageBox.Show(message, "Login Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);

        void ILoginView.Close()
        {
            DialogResult = DialogResult.OK;
            Close();
        }

        private void btnLogin_Click(object sender, EventArgs e) => LoginClicked?.Invoke(this, EventArgs.Empty);

        private void txtPassword_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
                LoginClicked?.Invoke(this, EventArgs.Empty);
        }

        private void labelTitle_Click(object sender, EventArgs e)
        {

        }
    }
}
