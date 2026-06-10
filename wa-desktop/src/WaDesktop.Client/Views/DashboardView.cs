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
        private string _preloadScript;

        public DashboardView()
        {
            InitializeComponent();
            webView.CoreWebView2InitializationCompleted += OnWebViewInitialized;
            webView.WebMessageReceived += OnWebMessageReceived;
            this.KeyPreview = true;
            this.KeyDown += DashboardView_KeyDown;
        }

        private void DashboardView_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.F12 && _initialized)
            {
                webView.CoreWebView2.OpenDevToolsWindow();
            }
        }

        // ── IDashboardView ──

        public string PreloadScript
        {
            set { _preloadScript = value; }
        }

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

                    // Inject preload script before navigate — runs BEFORE React loads
                    if (!string.IsNullOrEmpty(_preloadScript))
                    {
                        await webView.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(_preloadScript);
                        _preloadScript = null; // sudah terdaftar, jangan daftar ulang
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
                // Log JS console messages for debugging
                webView.CoreWebView2.ConsoleMessage += (s, args) =>
                {
                    System.Diagnostics.Debug.WriteLine("[WebView2 Console] " + args.Message);
                };

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
