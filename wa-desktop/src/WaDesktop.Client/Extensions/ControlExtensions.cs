using System;
using System.Windows.Forms;

namespace WaDesktop.Client.Extensions
{
    public static class ControlExtensions
    {
        /// <summary>Thread-safe UI update: marshal to UI thread if needed.</summary>
        public static void InvokeIfRequired(this Control control, Action action)
        {
            if (control.InvokeRequired)
                control.Invoke(action);
            else
                action();
        }
    }
}
