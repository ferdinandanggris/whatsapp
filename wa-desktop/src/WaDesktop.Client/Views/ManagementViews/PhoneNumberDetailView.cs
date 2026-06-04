using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Client.Extensions;
using System.Threading.Tasks;

namespace WaDesktop.Client.Views.ManagementViews
{
    public partial class PhoneNumberDetailView : UserControl, IPhoneNumberDetailView
    {
        private List<Company> _companies;

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
                string tmpVertical = null;
                if (this.InvokeRequired)
                {
                    BeginInvoke(new Action(() => tmpVertical = cboVertical.Text));
                    return tmpVertical;
                }
                return tmpVertical;
            }
        }
        public string WebsitesText => txtWebsites.Text.Trim();
        public string PendingUploadPath { get; private set; }
        public long? SelectedCompanyId
        {
            get
            {
                if (this.InvokeRequired)
                    return (long?)this.Invoke(new Func<long?>(() =>
                        cboCompany.SelectedItem is CompanyItem item ? item.Id : null));
                return cboCompany.SelectedItem is CompanyItem item2 ? item2.Id : null;
            }
        }

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
                txtWebsites.Text = detail.Websites != null
                    ? string.Join("\r\n", detail.Websites)
                    : "";

                SelectCompany(detail.CompanyId);
            });
        }

        public void LoadCompanies(IList<Company> companies)
        {
            this.InvokeIfRequired(() =>
            {
                _companies = companies.ToList();
                cboCompany.Items.Clear();
                cboCompany.Items.Add(new CompanyItem(null, "(No Company)"));
                foreach (var c in companies)
                    cboCompany.Items.Add(new CompanyItem(c.Id, c.Name));
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

        private void SelectCompany(long? companyId)
        {
            for (int i = 0; i < cboCompany.Items.Count; i++)
            {
                if (cboCompany.Items[i] is CompanyItem item && item.Id == companyId)
                {
                    cboCompany.SelectedIndex = i;
                    return;
                }
            }
            cboCompany.SelectedIndex = 0; // No Company
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

        private class CompanyItem
        {
            public long? Id { get; }
            public string Name { get; }
            public CompanyItem(long? id, string name) { Id = id; Name = name; }
            public override string ToString() => Name;
        }
    }
}
