using System;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Client.Extensions;

namespace WaDesktop.Client.Views
{
    public partial class DashboardView : UserControl, IDashboardView
    {
        private bool _initialized;

        public DashboardView()
        {
            InitializeComponent();
            webView.CoreWebView2InitializationCompleted += OnWebViewInitialized;
            webView.WebMessageReceived += OnWebMessageReceived;
        }

        // ── IDashboardView ──

        public string Url
        {
            set
            {
                this.InvokeIfRequired(async () =>
                {
                    if (!_initialized)
                    {
                        await webView.EnsureCoreWebView2Async(null);
                        _initialized = true;
                    }
                    webView.CoreWebView2.Navigate(value);
                });
            }
        }

        public event EventHandler LoadCompleted;
        public event EventHandler<WebMessageReceivedEventArgs> MessageReceived;

        public void ExecuteScript(string script)
        {
            if (_initialized && webView.CoreWebView2 != null)
                webView.CoreWebView2.ExecuteScriptAsync(script);
        }

        public string ShowSaveFileDialog(string defaultFileName, string filter)
        {
            using (SaveFileDialog dialog = new SaveFileDialog())
            {
                dialog.FileName = defaultFileName;
                dialog.Filter = filter;
                if (dialog.ShowDialog() == DialogResult.OK)
                    return dialog.FileName;
            }
            return null;
        }

        private void OnWebViewInitialized(object sender, CoreWebView2InitializationCompletedEventArgs e)
        {
            if (e.IsSuccess)
            {
                webView.CoreWebView2.NavigationCompleted += (s, args) =>
                {
                    LoadCompleted?.Invoke(this, EventArgs.Empty);
                };
            }
        }

        private void OnWebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            MessageReceived?.Invoke(this, new WebMessageReceivedEventArgs(e.WebMessageAsJson));
        }
    }
}
