using System;
using System.Collections.Generic;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Client.Extensions;

namespace WaDesktop.Client.Views
{
    public partial class SidebarView : UserControl, ISidebarView
    {
        private readonly ContextMenuStrip _phoneContextMenu;

        public SidebarView()
        {
            InitializeComponent();

            _phoneContextMenu = new ContextMenuStrip();
            _phoneContextMenu.Items.Add("Refresh", null, (s, e) => RefreshRequested?.Invoke(this, EventArgs.Empty));
        }

        // ── ISidebarView ──

        public bool IsLoading
        {
            set { this.InvokeIfRequired(() => { }); }
        }

        public event EventHandler<PhoneNumberSelectedEventArgs> PhoneNumberSelected;
        public event EventHandler RefreshRequested;

        public void LoadPhoneNumbers(IList<PhoneNumberNode> nodes)
        {
            this.InvokeIfRequired(() =>
            {
            });
        }

        public void UpdateUsageSummary(Company company)
        {
            this.InvokeIfRequired(() =>
            {
                if (company == null) return;

                string FormatLimit(int? limit) => limit.HasValue ? limit.Value.ToString() : "~";

                tbMarketingCount.Text = $"{company.UsageMarketing} / {FormatLimit(company.LimitMarketing)}";
                tbUtilityCount.Text = $"{company.UsageUtility} / {FormatLimit(company.LimitUtility)}";
                tbAuthenticationCount.Text = $"{company.UsageAuthentication} / {FormatLimit(company.LimitAuthentication)}";
                tbServiceCount.Text = $"{company.UsageService} / {FormatLimit(company.LimitService)}";

                var idId = new System.Globalization.CultureInfo("id-ID");
                tbBillMeta.Text = company.CurrentCost.ToString("C2", idId);
                tbMaxCost.Text = company.MetaCost.ToString("C2", idId);
                textBox1.Text = company.MaxEstimatedCost.HasValue ? company.MaxEstimatedCost.Value.ToString("C2", idId) : "~";
            });
        }

        private static TreeNode BuildTreeNode(PhoneNumberNode node)
        {
            var isGroup = string.IsNullOrEmpty(node.PhoneNumberId);
            var tn = new TreeNode
            {
                Text = isGroup
                    ? node.DisplayName
                    : !string.IsNullOrEmpty(node.DisplayName)
                        ? $"{node.DisplayName} ({node.DisplayPhoneNumber})"
                        : node.DisplayPhoneNumber,
                Tag = node
            };
            foreach (var child in node.Children)
                tn.Nodes.Add(BuildTreeNode(child));
            return tn;
        }

        private void TreeView_NodeMouseClick(object sender, TreeNodeMouseClickEventArgs e)
        {
            if (e.Button != MouseButtons.Right || e.Node == null) return;
    
        }

        private void TreeView_NodeMouseDoubleClick(object sender, TreeNodeMouseClickEventArgs e)
        {
            if (e.Node?.Tag is PhoneNumberNode node && !string.IsNullOrEmpty(node.PhoneNumberId))
            {
                PhoneNumberSelected?.Invoke(this,
                    new PhoneNumberSelectedEventArgs(node.PhoneNumberId, node.DisplayPhoneNumber, node.DisplayName));
            }
        }
    }
}
