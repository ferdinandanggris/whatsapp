using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;

namespace WaDesktop.Client.Helpers
{
    public static class TaskbarHelper
    {
        [ComImport]
        [Guid("ea1afb91-9e28-4b86-90e9-9e9f8a5eefaf")]
        [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
        private interface ITaskbarList3
        {
            // ITaskbarList
            [PreserveSig] int HrInit();
            [PreserveSig] int AddTab(IntPtr hwnd);
            [PreserveSig] int DeleteTab(IntPtr hwnd);
            [PreserveSig] int ActivateTab(IntPtr hwnd);
            [PreserveSig] int SetActiveAlt(IntPtr hwnd);

            // ITaskbarList2
            [PreserveSig] int MarkFullscreenWindow(IntPtr hwnd, [MarshalAs(UnmanagedType.Bool)] bool fFullscreen);

            // ITaskbarList3
            [PreserveSig] int SetProgressValue(IntPtr hwnd, ulong ullCompleted, ulong ullTotal);
            [PreserveSig] int SetProgressState(IntPtr hwnd, int tbpFlags);
            [PreserveSig] int RegisterTab(IntPtr hwndTab, IntPtr hwndMDI);
            [PreserveSig] int UnregisterTab(IntPtr hwndTab);
            [PreserveSig] int SetTabOrder(IntPtr hwndTab, IntPtr hwndInsertBefore);
            [PreserveSig] int SetTabActive(IntPtr hwndTab, IntPtr hwndMDI, uint tbatFlags);
            [PreserveSig] int ThumbBarAddButtons(IntPtr hwnd, uint cButtons, IntPtr pButtons);
            [PreserveSig] int ThumbBarUpdateButtons(IntPtr hwnd, uint cButtons, IntPtr pButtons);
            [PreserveSig] int ThumbBarSetImageList(IntPtr hwnd, IntPtr himl);
            [PreserveSig] int SetOverlayIcon(IntPtr hwnd, IntPtr hIcon, [MarshalAs(UnmanagedType.LPWStr)] string pszDescription);
            [PreserveSig] int SetThumbnailTooltip(IntPtr hwnd, [MarshalAs(UnmanagedType.LPWStr)] string pszTip);
            [PreserveSig] int SetThumbnailClip(IntPtr hwnd, IntPtr prcClip);
        }

        [ComImport]
        [Guid("56fdf344-fd6d-11d0-958a-006097c9a090")]
        [ClassInterface(ClassInterfaceType.None)]
        private class TaskbarList { }

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool DestroyIcon(IntPtr hIcon);

        [DllImport("shell32.dll", SetLastError = true)]
        private static extern int SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        private static ITaskbarList3 _taskbarList;
        private static bool _initializationFailed;
        private static bool _appIdSet;

        public static void SetBadge(IntPtr hWnd, int count)
        {
            if (hWnd == IntPtr.Zero || _initializationFailed) return;

            try
            {
                if (!_appIdSet)
                {
                    SetCurrentProcessExplicitAppUserModelID("WaDesktop.Client.App");
                    _appIdSet = true;
                }

                if (_taskbarList == null)
                {
                    if (Environment.OSVersion.Version.Major >= 6)
                    {
                        _taskbarList = (ITaskbarList3)new TaskbarList();
                        int hr = _taskbarList.HrInit();
                        if (hr < 0)
                        {
                            _taskbarList = null;
                            _initializationFailed = true;
                            return;
                        }
                    }
                    else
                    {
                        _initializationFailed = true;
                        return;
                    }
                }

                if (count <= 0)
                {
                    _taskbarList.SetOverlayIcon(hWnd, IntPtr.Zero, "");
                    return;
                }

                IntPtr hIcon = CreateBadgeIconHandle(count);
                if (hIcon != IntPtr.Zero)
                {
                    _taskbarList.SetOverlayIcon(hWnd, hIcon, count + " unread messages");
                    DestroyIcon(hIcon);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("TaskbarHelper.SetBadge error: " + ex.Message);
            }
        }

        public static void SetWarningBadge(IntPtr hWnd)
        {
            if (hWnd == IntPtr.Zero || _initializationFailed) return;

            try
            {
                if (!_appIdSet)
                {
                    SetCurrentProcessExplicitAppUserModelID("WaDesktop.Client.App");
                    _appIdSet = true;
                }

                if (_taskbarList == null)
                {
                    if (Environment.OSVersion.Version.Major >= 6)
                    {
                        _taskbarList = (ITaskbarList3)new TaskbarList();
                        int hr = _taskbarList.HrInit();
                        if (hr < 0)
                        {
                            _taskbarList = null;
                            _initializationFailed = true;
                            return;
                        }
                    }
                    else
                    {
                        _initializationFailed = true;
                        return;
                    }
                }

                IntPtr hIcon = CreateWarningIconHandle();
                if (hIcon != IntPtr.Zero)
                {
                    _taskbarList.SetOverlayIcon(hWnd, hIcon, "Connection error");
                    DestroyIcon(hIcon);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine("TaskbarHelper.SetWarningBadge error: " + ex.Message);
            }
        }

        private static IntPtr CreateBadgeIconHandle(int count)
        {
            try
            {
                using (Bitmap bitmap = new Bitmap(16, 16))
                {
                    using (Graphics g = Graphics.FromImage(bitmap))
                    {
                        g.SmoothingMode = SmoothingMode.AntiAlias;
                        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

                        g.FillEllipse(Brushes.Red, 0, 0, 15, 15);
                        g.DrawEllipse(new Pen(Color.White, 1), 0, 0, 15, 15);

                        string text = count > 99 ? "99+" : count.ToString();
                        float fontSize = text.Length > 2 ? 6.5f : 8f;

                        using (Font font = new Font("Arial", fontSize, FontStyle.Bold))
                        {
                            SizeF size = g.MeasureString(text, font);

                            float x = (16 - size.Width) / 2;
                            float y = (16 - size.Height) / 2;

                            g.DrawString(text, font, Brushes.White, x, y);
                        }
                    }

                    return bitmap.GetHicon();
                }
            }
            catch
            {
                return IntPtr.Zero;
            }
        }

        private static IntPtr CreateWarningIconHandle()
        {
            try
            {
                using (Bitmap bitmap = new Bitmap(16, 16))
                {
                    using (Graphics g = Graphics.FromImage(bitmap))
                    {
                        g.SmoothingMode = SmoothingMode.AntiAlias;
                        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

                        g.FillEllipse(Brushes.Red, 0, 0, 15, 15);
                        g.DrawEllipse(new Pen(Color.White, 1), 0, 0, 15, 15);

                        using (Font font = new Font("Arial", 8f, FontStyle.Bold))
                        {
                            string text = "!";
                            SizeF size = g.MeasureString(text, font);

                            float x = (16 - size.Width) / 2;
                            float y = (16 - size.Height) / 2;

                            g.DrawString(text, font, Brushes.White, x, y);
                        }
                    }

                    return bitmap.GetHicon();
                }
            }
            catch
            {
                return IntPtr.Zero;
            }
        }
    }
}
