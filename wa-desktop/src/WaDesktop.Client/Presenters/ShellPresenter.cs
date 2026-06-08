using System;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Messages;
using WaDesktop.Domain.State;
using WaDesktop.Infrastructure;
using WaDesktop.Client.Views;
using WaDesktop.Client.Views.ManagementViews;

namespace WaDesktop.Client.Presenters
{
    public class ShellPresenter : IDisposable
    {
        private readonly IShellView _view;
        private readonly IAuthService _auth;
        private readonly IEventAggregator _bus;
        private readonly AppState _state;
        private IDisposable _tabSub;
        private IDisposable _sessionSub;
        private IDisposable _notifSub;
        private IDisposable _badgeSub;
        private bool _disposed;

        public ShellPresenter(IShellView view, IAuthService auth, IEventAggregator bus, AppState state)
        {
            _view = view;
            _auth = auth;
            _bus = bus;
            _state = state;

            _tabSub = bus.Subscribe<RequestOpenTabMessage>(OnRequestOpenTab);
            _sessionSub = bus.Subscribe<SessionExpiredMessage>(OnSessionExpired);
            _notifSub = bus.Subscribe<ShowNotificationMessage>(m => _view.ShowNotification(m.Title, m.Body));
            _badgeSub = bus.Subscribe<SetBadgeMessage>(m => _view.SetBadge(m.Count));

            view.DashboardClicked += (s, e) => OpenDashboard();
            view.CompanyClicked += (s, e) => OpenCompany();
            view.UsersClicked += (s, e) => OpenUsers();
            view.TemplatesClicked += (s, e) => OpenTemplates();
            view.AppSettingsClicked += (s, e) => OpenAppSettings();
            view.LogoutClicked += OnLogout;

            view.AppSettingsVisible = _auth.IsSuperAdmin;
            view.StatusText = $"Logged in as {_auth.DisplayName}";
        }

        private void OnRequestOpenTab(RequestOpenTabMessage msg)
        {
            _view.AddOrSelectTab(msg.ModuleKey, msg.Title, CreateModuleView(msg.ModuleKey));
        }

        private IViewBase CreateModuleView(string moduleKey)
        {
            switch (moduleKey)
            {
                case "dashboard":
                    var dashView = new DashboardView();
                    var dashPresenter = new DashboardPresenter(dashView, _bus, _auth);
                    ServiceLocator.Register(dashPresenter);
                    return dashView;

                case "company":
                    var coView = new CompanyView();
                    var coPresenter = new CompanyPresenter(coView, ServiceLocator.Resolve<IApiClient>(), _bus);
                    ServiceLocator.Register(coPresenter);
                    coPresenter.LoadData();
                    return coView;

                case "users":
                    var usrView = new UsersView();
                    var usrPresenter = new UsersPresenter(usrView, ServiceLocator.Resolve<IApiClient>(), _bus);
                    ServiceLocator.Register(usrPresenter);
                    usrPresenter.LoadData();
                    return usrView;

                case "templates":
                    var tplView = new TemplatesView();
                    var tplPresenter = new TemplatesPresenter(tplView, ServiceLocator.Resolve<IApiClient>(), _bus);
                    ServiceLocator.Register(tplPresenter);
                    tplPresenter.LoadData();
                    return tplView;

                case "appsettings":
                    var setView = new AppSettingsView();
                    var setPresenter = new AppSettingsPresenter(setView, ServiceLocator.Resolve<IApiClient>());
                    ServiceLocator.Register(setPresenter);
                    setPresenter.LoadData();
                    return setView;

                default:
                    if (moduleKey.StartsWith("phonedetail_"))
                    {
                        var phoneId = moduleKey.Substring("phonedetail_".Length);
                        var detailView = new PhoneNumberDetailView();
                        var detailPresenter = new PhoneNumberDetailPresenter(detailView, ServiceLocator.Resolve<IApiClient>(), phoneId);
                        ServiceLocator.Register(detailPresenter);
                        detailPresenter.LoadData();
                        return detailView;
                    }
                    throw new ArgumentException($"Unknown module key: {moduleKey}");
            }
        }

        private void OpenDashboard() => OnRequestOpenTab(new RequestOpenTabMessage("dashboard", "Dashboard"));
        private void OpenCompany() => OnRequestOpenTab(new RequestOpenTabMessage("company", "Company"));
        private void OpenUsers() => OnRequestOpenTab(new RequestOpenTabMessage("users", "Users"));
        private void OpenTemplates() => OnRequestOpenTab(new RequestOpenTabMessage("templates", "Templates"));
        private void OpenAppSettings() => OnRequestOpenTab(new RequestOpenTabMessage("appsettings", "App Settings"));

        private void OnSessionExpired(SessionExpiredMessage msg)
        {
            _view.ClearTabs();
            _view.StatusText = "Session expired — login ulang";

            var loginView = new LoginView();
            var loginPresenter = new LoginPresenter(loginView, _auth, _bus);
            if (loginView.ShowDialog() == DialogResult.OK)
            {
                _view.StatusText = $"Logged in as {_auth.DisplayName}";
                OpenDashboard();
            }
            else
            {
                _auth.Logout();
                _bus.Publish(new LogoutMessage());
                _view.StatusText = "Logged out";
            }
            loginPresenter.Dispose();
        }

        private void OnLogout(object sender, EventArgs e)
        {
            _auth.Logout();
            _bus.Publish(new LogoutMessage());
            _view.ClearTabs();
            _view.StatusText = "Logged out";
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _tabSub?.Dispose();
                _sessionSub?.Dispose();
                _notifSub?.Dispose();
                _badgeSub?.Dispose();
                _disposed = true;
            }
        }
    }
}
