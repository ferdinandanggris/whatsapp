using System;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Client.Extensions;

namespace WaDesktop.Client.Views
{
    public partial class MessagesView : UserControl, IMessagesView
    {
        private bool _initialized;
        private string _preloadScript;

        public MessagesView()
        {
            InitializeComponent();
            webView.CoreWebView2InitializationCompleted += OnWebViewInitialized;
            webView.WebMessageReceived += OnWebMessageReceived;
        }

        protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
        {
            if (keyData == Keys.F12 && _initialized)
            {
                webView.CoreWebView2.OpenDevToolsWindow();
                return true;
            }
            return base.ProcessCmdKey(ref msg, keyData);
        }

        // ── IMessagesView ──

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

        public async void ExecuteScript(string script)
        {
            // Check if we are running on a non-UI thread
            if (this.InvokeRequired)
            {
                // Marshal the call to the UI thread asynchronously
                this.BeginInvoke(new Action(() => ExecuteScript(script)));
                return;
            }

            try
            {
                // 2. Pastikan WebView2 control-nya sendiri tidak null
                if (this.webView == null) return;

                // 3. JIKA CoreWebView2 belum diinisialisasi, tunggu sampai siap
                // Ini sering terjadi jika token masuk tepat saat aplikasi baru terbuka
                if (this.webView.CoreWebView2 == null)
                {
                    // Menunggu inisialisasi internal selesai tanpa memblock UI thread
                    await this.webView.EnsureCoreWebView2Async(null);
                }

                // 4. Jalankan script dengan aman
                await this.webView.CoreWebView2.ExecuteScriptAsync(script);
            }
            catch (Exception ex)
            {
                // Log atau handle exception jika ada masalah saat eksekusi script
                System.Diagnostics.Debug.WriteLine($"WebView2 Error: {ex.Message}");
            }
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
