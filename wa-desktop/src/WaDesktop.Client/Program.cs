using System;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.State;
using WaDesktop.Infrastructure;
using WaDesktop.Infrastructure.EventAggregator;
using WaDesktop.Infrastructure.Services;
using WaDesktop.Client.Views;
using WaDesktop.Client.Presenters;

namespace WaDesktop.Client
{
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // ── DI Registration ──
            var appState = new AppState();
            var eventAggregator = new EventAggregator();
            var apiClient = new ApiClient("http://localhost:8080");
            var authService = new AuthService(apiClient, appState);

            ServiceLocator.Register<IEventAggregator>(eventAggregator);
            ServiceLocator.Register<IApiClient>(apiClient);
            ServiceLocator.Register<IAuthService>(authService);
            ServiceLocator.Register(appState);

            // ── Login ──
            var loginView = new LoginView();
            var loginPresenter = new LoginPresenter(loginView, authService, eventAggregator);
            ServiceLocator.Register(loginPresenter);

            if (loginView.ShowDialog() != DialogResult.OK)
            {
                // User closed login form — exit
                loginPresenter.Dispose();
                return;
            }

            // ── Shell ──
            var shellView = new ShellView();
            var shellPresenter = new ShellPresenter(shellView, authService, eventAggregator, appState);
            ServiceLocator.Register(shellPresenter);

            // ── Sidebar ──
            var sidebarView = new SidebarView();
            var sidebarPresenter = new SidebarPresenter(sidebarView, apiClient, eventAggregator);
            shellView.Controls["panelSidebar"]?.Controls.Add(sidebarView);
            sidebarView.Dock = DockStyle.Fill;
            _ = sidebarPresenter.LoadDataAsync();

            Application.Run(shellView);

            // Cleanup
            loginPresenter.Dispose();
            shellPresenter.Dispose();
        }
    }
}
