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
            _phoneContextMenu.Items.Add("Sinkron Meta", null, (s, e) => SyncFromMetaRequested?.Invoke(this, EventArgs.Empty));
            _phoneContextMenu.Items.Add("Refresh", null, (s, e) => RefreshRequested?.Invoke(this, EventArgs.Empty));

            treeView.NodeMouseClick += TreeView_NodeMouseClick;
            treeView.NodeMouseDoubleClick += TreeView_NodeMouseDoubleClick;
        }

        // ── ISidebarView ──

        public bool IsLoading
        {
            set { this.InvokeIfRequired(() => { treeView.Enabled = !value; Cursor = value ? Cursors.WaitCursor : Cursors.Default; }); }
        }

        public event EventHandler<PhoneNumberSelectedEventArgs> PhoneNumberSelected;
        public event EventHandler SyncFromMetaRequested;
        public event EventHandler RefreshRequested;

        public void LoadPhoneNumbers(IList<PhoneNumberNode> nodes)
        {
            this.InvokeIfRequired(() =>
            {
                treeView.Nodes.Clear();
                foreach (var node in nodes)
                {
                    treeView.Nodes.Add(BuildTreeNode(node));
                }
                treeView.ExpandAll();
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
            treeView.SelectedNode = e.Node;

            // Only show context menu on root "Phone Numbers" node
            if (e.Node.Parent == null && e.Node.Tag is PhoneNumberNode pn && string.IsNullOrEmpty(pn.PhoneNumberId))
            {
                _phoneContextMenu.Show(treeView, e.Location);
            }
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
