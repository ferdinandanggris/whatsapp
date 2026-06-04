using System;
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
        private IDisposable _loginSub;
        private IDisposable _tokenRefreshSub;
        private bool _disposed;

        public DashboardPresenter(IDashboardView view, IEventAggregator bus, IAuthService auth)
        {
            _view = view;
            _bus = bus;
            _auth = auth;

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
                }
            }
            catch
            {
                // Ignore malformed messages from SPA
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
                _disposed = true;
            }
        }
    }
}
