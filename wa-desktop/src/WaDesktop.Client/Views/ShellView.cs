using System;
using System.Drawing;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Client.Extensions;
using WaDesktop.Client.Helpers;

namespace WaDesktop.Client.Views
{
    public partial class ShellView : Form, IShellView
    {
        private static readonly Font _xFont = new Font("Arial", 9f, FontStyle.Bold);
        private static readonly Brush _xBrush = new SolidBrush(Color.FromArgb(180, 100, 100));
        private static readonly Brush _xHoverBrush = new SolidBrush(Color.FromArgb(220, 60, 60));
        private int _hoveredTabIndex = -1;

        public ShellView()
        {
            InitializeComponent();
            notifyIcon.Icon = this.Icon;

            // Enable double-buffering on TabControl to eliminate flicker
            typeof(TabControl).GetProperty("DoubleBuffered",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)
                ?.SetValue(tabWorkspace, true, null);
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

        public void RenderSidebar(IViewBase sidebarContent)
        {
            var control = sidebarContent as Control;
            if (control == null)
                throw new ArgumentException("sidebarContent must be a WinForms Control");
            this.InvokeIfRequired(() =>
            {
                control.Dock = DockStyle.Fill;
                panelSidebar.Controls.Clear();
                panelSidebar.Controls.Add(control);
                control.Dock = DockStyle.Fill;
            });
        }

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

                var page = new TabPage(title) { Name = key, UseVisualStyleBackColor = true };
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

        public void ShowNotification(string title, string body)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => ShowNotification(title, body)));
                return;
            }

            notifyIcon.BalloonTipTitle = title;
            notifyIcon.BalloonTipText = body;
            notifyIcon.ShowBalloonTip(3000);
        }

        public void SetBadge(int count)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => SetBadge(count)));
                return;
            }

            TaskbarHelper.SetBadge(this.Handle, count);
        }

        // ── Tab Close Button (OwnerDraw) ──

        private void TabWorkspace_DrawItem(object sender, DrawItemEventArgs e)
        {
            TabPage page = tabWorkspace.TabPages[e.Index];
            Rectangle tabRect = tabWorkspace.GetTabRect(e.Index);

            // Background — fill manual, hindari e.DrawBackground()
            // yang kirim WM_ERASEBKGND (erase pass terpisah → glitch)
            using (var bgBrush = new SolidBrush(tabWorkspace.BackColor))
                e.Graphics.FillRectangle(bgBrush, tabRect);
            if (e.Index == tabWorkspace.SelectedIndex)
                e.Graphics.FillRectangle(SystemBrushes.Highlight, tabRect);

            // Tab text
            TextRenderer.DrawText(e.Graphics, page.Text, page.Font,
                new Rectangle(tabRect.X + 4, tabRect.Y + 2, tabRect.Width - 26, tabRect.Height - 4),
                e.Index == tabWorkspace.SelectedIndex ? SystemColors.HighlightText : SystemColors.ControlText,
                TextFormatFlags.Left | TextFormatFlags.VerticalCenter); 

            // Close × button
            int xBtnSize = 16;
            int xBtnX = tabRect.Right - xBtnSize - 4;
            int xBtnY = tabRect.Y + (tabRect.Height - xBtnSize) / 2;

            Brush brush = (e.Index == _hoveredTabIndex) ? _xHoverBrush : _xBrush;
            e.Graphics.DrawString("×", _xFont, brush, xBtnX, xBtnY + 1);
        }

        private void TabWorkspace_MouseDown(object sender, MouseEventArgs e)
        {
            for (int i = 0; i < tabWorkspace.TabPages.Count; i++)
            {
                Rectangle tabRect = tabWorkspace.GetTabRect(i);
                int xBtnX = tabRect.Right - 20;
                Rectangle xRect = new Rectangle(xBtnX, tabRect.Y, 20, tabRect.Height);

                if (xRect.Contains(e.Location))
                {
                    CloseTab(tabWorkspace.TabPages[i].Name);
                    return;
                }
            }
        }

        private void TabWorkspace_MouseMove(object sender, MouseEventArgs e)
        {
            int prev = _hoveredTabIndex;
            _hoveredTabIndex = -1;

            for (int i = 0; i < tabWorkspace.TabPages.Count; i++)
            {
                Rectangle tabRect = tabWorkspace.GetTabRect(i);
                int xBtnX = tabRect.Right - 20;
                Rectangle xRect = new Rectangle(xBtnX, tabRect.Y, 20, tabRect.Height);

                if (xRect.Contains(e.Location))
                {
                    _hoveredTabIndex = i;
                    break;
                }
            }

            if (_hoveredTabIndex != prev)
            {
                // Tab bisa berubah jumlah antara simpan prev dan Invalidate
                // misal tab dihapus via × click → GetTabRect(out of range)
                if (prev >= 0 && prev < tabWorkspace.TabCount)
                    tabWorkspace.Invalidate(tabWorkspace.GetTabRect(prev));
                if (_hoveredTabIndex >= 0 && _hoveredTabIndex < tabWorkspace.TabCount)
                    tabWorkspace.Invalidate(tabWorkspace.GetTabRect(_hoveredTabIndex));
            }
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

        private void NotifyIcon_BalloonTipClicked(object sender, EventArgs e)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => NotifyIcon_BalloonTipClicked(sender, e)));
                return;
            }

            if (this.WindowState == FormWindowState.Minimized)
                this.WindowState = FormWindowState.Normal;
            this.Activate();
            this.Focus();
        }
    }
}
