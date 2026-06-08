using System;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Windows.Forms;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Messages;

namespace WaDesktop.Client.Presenters
{
    public class DashboardPresenter : IDisposable
    {
        private readonly IDashboardView _view;
        private readonly IEventAggregator _bus;
        private readonly IAuthService _auth;
        private readonly HttpClient _http;
        private IDisposable _loginSub;
        private IDisposable _tokenRefreshSub;
        private bool _disposed;

        public DashboardPresenter(IDashboardView view, IEventAggregator bus, IAuthService auth)
        {
            _view = view;
            _bus = bus;
            _auth = auth;
            _http = new HttpClient();

            _view.LoadCompleted += OnLoadCompleted;
            _view.MessageReceived += OnMessageReceived;
            _loginSub = bus.Subscribe<LoginCompletedMessage>(_ => InjectToken());
            _tokenRefreshSub = bus.Subscribe<TokenRefreshedMessage>(_ => InjectToken());

            // Load frontend SPA
            _view.Url = "http://localhost:5173"; // Vite dev server
        }

        private void OnLoadCompleted(object sender, EventArgs e) => InjectToken();

        private void InjectToken()
        {
            if (string.IsNullOrEmpty(_auth.AccessToken)) return;

            var script = $@"
if (!window.__DESKTOP_BRIDGE__) {{
    window.__DESKTOP_BRIDGE__ = {{}};
}}
window.__DESKTOP_BRIDGE__.token = '{_auth.AccessToken}';
if (!window.__DESKTOP_BRIDGE__.postMessage) {{
    window.__DESKTOP_BRIDGE__.postMessage = function(msg) {{ window.chrome.webview.postMessage(JSON.stringify(msg)); }};
}}
";
            _view.ExecuteScript(script);
        }

        private void OnMessageReceived(object sender, WebMessageReceivedEventArgs e)
        {
            try
            {
                var msg = JsonConvert.DeserializeObject<JObject>(e.Message);
                var type = msg?.Value<string>("type");
                switch (type)
                {
                    case "logout":
                        _bus.Publish(new LogoutMessage());
                        break;

                    case "token_expired":
                        _bus.Publish(new SessionExpiredMessage());
                        break;

                    case "open_module":
                        var module = msg.Value<string>("module");
                        if (!string.IsNullOrEmpty(module))
                            _bus.Publish(new RequestOpenTabMessage(module, module));
                        break;

                    case "SAVE_IMAGE":
                        HandleSaveImage(msg);
                        break;

                    case "COPY_IMAGE":
                        HandleCopyImage(msg);
                        break;

                    case "SHOW_NOTIFICATION":
                        var title = msg.Value<string>("title") ?? "WA Desktop";
                        var body = msg.Value<string>("message") ?? "";
                        _bus.Publish(new ShowNotificationMessage(title, body));
                        break;

                    case "SET_BADGE":
                        int count = msg.TryGetValue("count", out var countToken) ? countToken.Value<int>() : 0;
                        _bus.Publish(new SetBadgeMessage(count));
                        break;
                }
            }
            catch
            {
                // Ignore malformed messages from SPA
            }
        }

        private async void HandleSaveImage(JObject msg)
        {
            var url = msg.Value<string>("url");
            if (string.IsNullOrEmpty(url)) return;

            try
            {
                byte[] imageBytes = await _http.GetByteArrayAsync(url);

                string fileName = Path.GetFileName(new Uri(url).LocalPath);
                if (string.IsNullOrEmpty(fileName)) fileName = "image.png";

                string defaultName = DateTime.Now.ToString("yyyyMMddHHmmss") + "_" + fileName;
                string savePath = _view.ShowSaveFileDialog(defaultName,
                    "Image Files|*.png;*.jpg;*.jpeg;*.gif;*.bmp|All Files|*.*");

                if (savePath != null)
                {
                    File.WriteAllBytes(savePath, imageBytes);
                    _bus.Publish(new ShowNotificationMessage("Gambar tersimpan!",
                        "Gambar berhasil disimpan ke " + Path.GetFileName(savePath)));
                }
            }
            catch (Exception ex)
            {
                _bus.Publish(new ShowNotificationMessage("Gagal menyimpan gambar", ex.Message));
            }
        }

        private async void HandleCopyImage(JObject msg)
        {
            var url = msg.Value<string>("url");
            if (string.IsNullOrEmpty(url)) return;

            try
            {
                byte[] imageBytes = await _http.GetByteArrayAsync(url);

                using (MemoryStream ms = new MemoryStream(imageBytes))
                {
                    Image img = Image.FromStream(ms);
                    Clipboard.SetImage(img);
                }

                _bus.Publish(new ShowNotificationMessage("Gambar tersalin!",
                    "Gambar tersalin ke clipboard."));
            }
            catch (Exception ex)
            {
                _bus.Publish(new ShowNotificationMessage("Gagal menyalin gambar", ex.Message));
            }
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _view.LoadCompleted -= OnLoadCompleted;
                _view.MessageReceived -= OnMessageReceived;
                _loginSub?.Dispose();
                _tokenRefreshSub?.Dispose();
                _http?.Dispose();
                _disposed = true;
            }
        }
    }
}
