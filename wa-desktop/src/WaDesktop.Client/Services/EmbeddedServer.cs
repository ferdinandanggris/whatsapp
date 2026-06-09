using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace WaDesktop.Client.Services
{
    /// <summary>
    /// Lightweight HTTP server that serves dist/ from wwwroot/.
    /// Gives WebView2 a proper http://localhost origin for CORS.
    /// C# 7.3 / .NET Framework 4.7.2 compatible.
    /// </summary>
    public class EmbeddedServer : IDisposable
    {
        private readonly HttpListener _listener;
        private readonly string _wwwRoot;
        private readonly string _apiBaseUrl;
        private readonly string _wsHost;
        private readonly CancellationTokenSource _cts = new CancellationTokenSource();
        private bool _disposed;

        public int Port { get; private set; }
        public string BaseUrl { get; private set; }

        public EmbeddedServer(string wwwRoot, string apiBaseUrl = "http://localhost:8080")
        {
            _wwwRoot = wwwRoot;
            _apiBaseUrl = apiBaseUrl;

            var uri = new Uri(apiBaseUrl);
            _wsHost = uri.IsDefaultPort ? uri.Host : uri.Host + ":" + uri.Port;

            _listener = new HttpListener();

            Port = GetRandomPort();
            BaseUrl = $"http://localhost:{Port}/";
            _listener.Prefixes.Add(BaseUrl);
        }

        private static int GetRandomPort()
        {
            var tcp = new TcpListener(IPAddress.Loopback, 0);
            try
            {
                tcp.Start();
                return ((IPEndPoint)tcp.LocalEndpoint).Port;
            }
            finally
            {
                tcp.Stop();
            }
        }

        public Task StartAsync()
        {
            _listener.Start();
            _ = Task.Run(() => ProcessRequestsAsync(_cts.Token));
            return Task.CompletedTask;
        }

        /// <summary>Script block injected into index.html so React has env vars immediately.</summary>
        private string GetEnvScript()
        {
            return $@"
<script>
window.__API_BASE__ = '{_apiBaseUrl}';
window.__WS_HOST__ = '{_wsHost}';
</script>";
        }

        /// <summary>Serve an HTML file with env injection, or a static file as-is.</summary>
        private byte[] ReadWithEnv(string filePath, string ext)
        {
            if (IsHtml(ext))
            {
                var html = File.ReadAllText(filePath);
                var injected = html.Replace("</head>", GetEnvScript() + "</head>");
                return Encoding.UTF8.GetBytes(injected);
            }
            return File.ReadAllBytes(filePath);
        }

        private static bool IsHtml(string ext)
        {
            return string.Equals(ext, ".html", StringComparison.OrdinalIgnoreCase);
        }

        private async Task ProcessRequestsAsync(CancellationToken ct)
        {
            try
            {
                while (!ct.IsCancellationRequested && _listener.IsListening)
                {
                    var ctx = await _listener.GetContextAsync();
                    ProcessRequest(ctx);
                }
            }
            catch (ObjectDisposedException) { }
            catch (HttpListenerException) when (ct.IsCancellationRequested) { }
            catch (OperationCanceledException) { }
        }

        private void ProcessRequest(HttpListenerContext ctx)
        {
            try
            {
                var path = ctx.Request.Url.AbsolutePath.TrimStart('/');
                if (string.IsNullOrEmpty(path)) path = "index.html";

                var filePath = Path.Combine(_wwwRoot, path);

                // Prevent path traversal
                if (!filePath.StartsWith(_wwwRoot, StringComparison.OrdinalIgnoreCase))
                {
                    ctx.Response.StatusCode = 403;
                    ctx.Response.Close();
                    return;
                }

                if (File.Exists(filePath))
                {
                    var ext = Path.GetExtension(filePath).ToLowerInvariant();
                    ctx.Response.ContentType = GetMimeType(ext);
                    ctx.Response.Headers.Add("Cache-Control", "no-cache");

                    var bytes = ReadWithEnv(filePath, ext);
                    ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
                    ctx.Response.StatusCode = 200;
                }
                else
                {
                    // SPA fallback — serve index.html for client-side routes
                    var indexPath = Path.Combine(_wwwRoot, "index.html");
                    if (File.Exists(indexPath))
                    {
                        ctx.Response.ContentType = "text/html";
                        var bytes = ReadWithEnv(indexPath, ".html");
                        ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
                        ctx.Response.StatusCode = 200;
                    }
                    else
                    {
                        ctx.Response.StatusCode = 404;
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("[EmbeddedServer] " + ex.Message);
                ctx.Response.StatusCode = 500;
            }
            finally
            {
                ctx.Response.Close();
            }
        }

        private static string GetMimeType(string ext)
        {
            switch (ext)
            {
                case ".html": return "text/html";
                case ".css": return "text/css";
                case ".js": return "application/javascript";
                case ".json": return "application/json";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                case ".woff": return "font/woff";
                case ".woff2": return "font/woff2";
                case ".wasm": return "application/wasm";
                default: return "application/octet-stream";
            }
        }

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _cts.Cancel();
            try { _listener.Stop(); } catch { }
            try { _listener.Close(); } catch { }
            _cts.Dispose();
        }
    }
}
