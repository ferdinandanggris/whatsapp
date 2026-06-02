using System;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Client.Extensions;

namespace WaDesktop.Client.Views
{
    public partial class ShellView : Form, IShellView
    {
        public ShellView()
        {
            InitializeComponent();
        }

        // ── IShellView ──

        public string StatusText
        {
            get => toolStripStatusLabel?.Text;
            set { this.InvokeIfRequired(() => { if (toolStripStatusLabel != null) toolStripStatusLabel.Text = value; }); }
        }

        public bool AppSettingsVisible
        {
            set { this.InvokeIfRequired(() => { appSettingsToolStripMenuItem.Visible = value; }); }
        }

        public event EventHandler DashboardClicked;
        public event EventHandler CompanyClicked;
        public event EventHandler UsersClicked;
        public event EventHandler TemplatesClicked;
        public event EventHandler AppSettingsClicked;
        public event EventHandler LogoutClicked;

        public void AddOrSelectTab(string key, string title, IViewBase content)
        {
            var control = content as Control;
            if (control == null)
                throw new ArgumentException("content must be a WinForms Control");

            this.InvokeIfRequired(() =>
            {
                for (int i = 0; i < tabWorkspace.TabPages.Count; i++)
                {
                    if (tabWorkspace.TabPages[i].Name == key)
                    {
                        tabWorkspace.SelectedIndex = i;
                        return;
                    }
                }

                var page = new TabPage(title) { Name = key };
                control.Dock = DockStyle.Fill;
                page.Controls.Add(control);
                tabWorkspace.TabPages.Add(page);
                tabWorkspace.SelectedIndex = tabWorkspace.TabPages.Count - 1;
            });
        }

        public void CloseTab(string key)
        {
            this.InvokeIfRequired(() =>
            {
                for (int i = 0; i < tabWorkspace.TabPages.Count; i++)
                {
                    if (tabWorkspace.TabPages[i].Name == key)
                    {
                        tabWorkspace.TabPages.RemoveAt(i);
                        return;
                    }
                }
            });
        }

        public void ClearTabs()
        {
            this.InvokeIfRequired(() => tabWorkspace.TabPages.Clear());
        }

        // ── Event Handlers ──

        private void dashboardToolStripMenuItem_Click(object sender, EventArgs e)
            => DashboardClicked?.Invoke(sender, e);

        private void companyToolStripMenuItem_Click(object sender, EventArgs e)
            => CompanyClicked?.Invoke(sender, e);

        private void usersToolStripMenuItem_Click(object sender, EventArgs e)
            => UsersClicked?.Invoke(sender, e);

        private void templatesToolStripMenuItem_Click(object sender, EventArgs e)
            => TemplatesClicked?.Invoke(sender, e);

        private void appSettingsToolStripMenuItem_Click(object sender, EventArgs e)
            => AppSettingsClicked?.Invoke(sender, e);

        private void logoutToolStripMenuItem_Click(object sender, EventArgs e)
            => LogoutClicked?.Invoke(sender, e);

        private void ShellView_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (e.CloseReason == CloseReason.UserClosing)
            {
                var result = MessageBox.Show("Keluar dari aplikasi?", "Konfirmasi",
                    MessageBoxButtons.YesNo, MessageBoxIcon.Question);
                if (result != DialogResult.Yes)
                    e.Cancel = true;
            }
        }
    }
}
