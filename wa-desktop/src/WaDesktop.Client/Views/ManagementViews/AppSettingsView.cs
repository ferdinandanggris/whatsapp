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

        public string WebhookUrl
        {
            get => txtWebhookUrl.Text;
            set => this.InvokeIfRequired(() => txtWebhookUrl.Text = value);
        }

        public string ApiKey
        {
            get => txtApiKey.Text;
            set => this.InvokeIfRequired(() => txtApiKey.Text = value);
        }

        public string WabaId
        {
            get => txtWabaId.Text;
            set => this.InvokeIfRequired(() => txtWabaId.Text = value);
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
