using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Client.Extensions;

namespace WaDesktop.Client.Views.ManagementViews
{
    public partial class PhoneNumberDetailView : UserControl, IPhoneNumberDetailView
    {
        public PhoneNumberDetailView()
        {
            InitializeComponent();
        }

        // ── IPhoneNumberDetailView ──

        public string DisplayName => txtDisplayName.Text.Trim();
        public string Description => txtDescription.Text.Trim();
        public string Email => txtEmail.Text.Trim();
        public string About => txtAbout.Text.Trim();
        public string Address => txtAddress.Text.Trim();
        public string Vertical {
            get {
                if (this.InvokeRequired)
                {
                    return (string)this.Invoke(new Func<string>(() => cboVertical.Text));
                }
                return cboVertical.Text;
            }
        }
        public string Website1 => txtWebsite1.Text.Trim();
        public string Website2 => txtWebsite2.Text.Trim();
        public string PendingUploadPath { get; private set; }

        public bool IsSaving
        {
            set
            {
                this.InvokeIfRequired(() =>
                {
                    btnSave.Enabled = !value;
                    btnUploadPhoto.Enabled = !value;
                    btnFetchMeta.Enabled = !value;
                    Cursor = value ? Cursors.WaitCursor : Cursors.Default;
                });
            }
        }

        public event EventHandler SaveClicked;
        public event EventHandler FetchFromMetaClicked;
        public event EventHandler UploadPhotoClicked;
        public event EventHandler RefreshClicked;

        public void LoadDetail(PhoneNumberDetail detail)
        {
            this.InvokeIfRequired(() =>
            {
                txtPhoneId.Text = detail.PhoneNumberId;
                txtDisplayName.Text = detail.DisplayName;
                txtDescription.Text = detail.Description;
                txtQuality.Text = detail.QualityRating;
                txtEmail.Text = detail.Email ?? "";
                txtAbout.Text = detail.About ?? "";
                txtAddress.Text = detail.Address ?? "";
                cboVertical.Text = detail.Vertical ?? "";
                txtWebsite1.Text = detail.Websites != null && detail.Websites.Count > 0 ? detail.Websites[0] : "";
                txtWebsite2.Text = detail.Websites != null && detail.Websites.Count > 1 ? detail.Websites[1] : "";
            });
        }

        public async void LoadProfilePicture(byte[] imageData)
        {
            try
            {
                using (var ms = new MemoryStream(imageData))
                    picProfile.Image = Image.FromStream(ms);
            }
            catch
            {
                // Ignore image load failures
            }
        }

        public void ShowError(string message) => MessageBox.Show(message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        public void ShowWarning(string message) => MessageBox.Show(message, "Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        public void ShowSuccess(string message) => MessageBox.Show(message, "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);

        // ── Event Handlers ──

        private void BtnSave_Click(object sender, EventArgs e) => SaveClicked?.Invoke(this, EventArgs.Empty);
        private void BtnFetchMeta_Click(object sender, EventArgs e) => FetchFromMetaClicked?.Invoke(this, EventArgs.Empty);
        private void BtnUploadPhoto_Click(object sender, EventArgs e)
        {
            using (var dlg = new OpenFileDialog())
            {
                dlg.Filter = "Images|*.jpg;*.jpeg;*.png;*.gif;*.bmp";
                dlg.Title = "Select Profile Picture";
                if (dlg.ShowDialog() == DialogResult.OK)
                {
                    PendingUploadPath = dlg.FileName;
                    UploadPhotoClicked?.Invoke(this, EventArgs.Empty);
                }
            }
        }

    }
}
