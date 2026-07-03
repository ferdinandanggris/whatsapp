using System;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Client.Extensions;

namespace WaDesktop.Client.Views.ManagementViews
{
    public partial class AppSettingsView : UserControl, IAppSettingsView
    {
        public AppSettingsView()
        {
            InitializeComponent();
        }

        public string WabaToken
        {
            get => txtWabaToken.Text;
            set => this.InvokeIfRequired(() => txtWabaToken.Text = value);
        }

        public string AppId
        {
            get => txtAppId.Text;
            set => this.InvokeIfRequired(() => txtAppId.Text = value);
        }

        public string BusinessId
        {
            get => txtBusinessId.Text;
            set => this.InvokeIfRequired(() => txtBusinessId.Text = value);
        }

        public string VerifyToken
        {
            get => txtVerifyToken.Text;
            set => this.InvokeIfRequired(() => txtVerifyToken.Text = value);
        }

        public bool IsSaving
        {
            set
            {
                this.InvokeIfRequired(() =>
                {
                    btnSave.Enabled = !value;
                    Cursor = value ? Cursors.WaitCursor : Cursors.Default;
                });
            }
        }

        public event EventHandler SaveClicked;
        public event EventHandler RefreshClicked;

        public void ShowSuccess(string message) => MessageBox.Show(message, "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
        public void ShowWarning(string message) => MessageBox.Show(message, "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        public void ShowError(string message) => MessageBox.Show(message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);

        private void btnSave_Click(object sender, EventArgs e) => SaveClicked?.Invoke(this, EventArgs.Empty);
        private void btnRefresh_Click(object sender, EventArgs e) => RefreshClicked?.Invoke(this, EventArgs.Empty);
    }
}