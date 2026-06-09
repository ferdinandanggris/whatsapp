using System;
using System.IO;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Messages;
using WaDesktop.Domain.State;
using WaDesktop.Infrastructure;
using WaDesktop.Infrastructure.EventAggregator;
using WaDesktop.Infrastructure.Services;
using WaDesktop.Client.Services;
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

            // ── Config ──
            var apiBaseUrl = "http://localhost:8080";
            var wwwRoot = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot");
            Directory.CreateDirectory(wwwRoot);

            // ── Embedded server (serve React build) ──
            using (var embeddedServer = new EmbeddedServer(wwwRoot, apiBaseUrl))
            {
                embeddedServer.StartAsync().GetAwaiter().GetResult();
                var dashboardUrl = embeddedServer.BaseUrl;

                // ── DI Registration ──
                var appState = new AppState();
                var eventAggregator = new EventAggregator();
                var apiClient = new ApiClient(apiBaseUrl);
                var authService = new AuthService(apiClient, appState);

                ServiceLocator.Register<IEventAggregator>(eventAggregator);
                ServiceLocator.Register<IApiClient>(apiClient);
                ServiceLocator.Register<IAuthService>(authService);
                ServiceLocator.Register(appState);

                // ── Session Expired → publish message ──
                apiClient.SessionExpired += (s, e) => eventAggregator.Publish(new SessionExpiredMessage());
                // ── Token Refreshed → notify bridge subscribers ──
                apiClient.TokenRefreshed += (s, e) => eventAggregator.Publish(new TokenRefreshedMessage());

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
                var shellPresenter = new ShellPresenter(shellView, authService, eventAggregator, appState,
                    dashboardUrl, apiBaseUrl);
                ServiceLocator.Register(shellPresenter);

                // ── Sidebar ──
                var sidebarView = new SidebarView();
                var sidebarPresenter = new SidebarPresenter(sidebarView, apiClient, eventAggregator);
                shellView.RenderSidebar(sidebarView);
                _ = sidebarPresenter.LoadDataAsync();

                Application.Run(shellView);

                // Cleanup
                loginPresenter.Dispose();
                shellPresenter.Dispose();
            }
        }
    }
}
