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
        public SidebarView()
        {
            InitializeComponent();
            treeView.NodeMouseDoubleClick += TreeView_NodeMouseDoubleClick;
        }

        // ── ISidebarView ──

        public bool IsLoading
        {
            set { this.InvokeIfRequired(() => { treeView.Enabled = !value; Cursor = value ? Cursors.WaitCursor : Cursors.Default; }); }
        }

        public event EventHandler<PhoneNumberSelectedEventArgs> PhoneNumberSelected;

        public void LoadPhoneNumbers(IList<PhoneNumberNode> nodes)
        {
            this.InvokeIfRequired(() =>
            {
                treeView.Nodes.Clear();
                foreach (var node in nodes)
                {
                    var tn = new TreeNode
                    {
                        Text = !string.IsNullOrEmpty(node.DisplayName)
                            ? $"{node.DisplayName} ({node.DisplayPhoneNumber})"
                            : node.DisplayPhoneNumber,
                        Tag = node
                    };
                    foreach (var child in node.Children)
                    {
                        tn.Nodes.Add(new TreeNode
                        {
                            Text = !string.IsNullOrEmpty(child.DisplayName)
                                ? $"{child.DisplayName} ({child.DisplayPhoneNumber})"
                                : child.DisplayPhoneNumber,
                            Tag = child
                        });
                    }
                    treeView.Nodes.Add(tn);
                }
                treeView.ExpandAll();
            });
        }

        private void TreeView_NodeMouseDoubleClick(object sender, TreeNodeMouseClickEventArgs e)
        {
            if (e.Node?.Tag is PhoneNumberNode node)
            {
                PhoneNumberSelected?.Invoke(this,
                    new PhoneNumberSelectedEventArgs(node.PhoneNumberId, node.DisplayPhoneNumber, node.DisplayName));
            }
        }
    }
}
