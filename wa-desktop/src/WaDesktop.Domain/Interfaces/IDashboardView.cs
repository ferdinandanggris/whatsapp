using System;

namespace WaDesktop.Domain.Interfaces
{
    public interface IDashboardView : IViewBase
    {
        /// <summary>URL yang akan di-load di WebView.</summary>
        string Url { set; }

        /// <summary>Event: halaman selesai di-load.</summary>
        event EventHandler LoadCompleted;

        /// <summary>Eksekusi JavaScript di WebView.</summary>
        void ExecuteScript(string script);

        /// <summary>Event: menerima pesan dari JavaScript (via postMessage).</summary>
        event EventHandler<WebMessageReceivedEventArgs> MessageReceived;
    }

    public class WebMessageReceivedEventArgs : EventArgs
    {
        public string Message { get; }
        public WebMessageReceivedEventArgs(string message) => Message = message;
    }
}
