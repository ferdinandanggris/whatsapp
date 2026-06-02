using System;
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
        private bool _disposed;

        public ShellPresenter(IShellView view, IAuthService auth, IEventAggregator bus, AppState state)
        {
            _view = view;
            _auth = auth;
            _bus = bus;
            _state = state;

            _tabSub = bus.Subscribe<RequestOpenTabMessage>(OnRequestOpenTab);

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
                    var dashPresenter = new DashboardPresenter(dashView, _bus);
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
                    throw new ArgumentException($"Unknown module key: {moduleKey}");
            }
        }

        private void OpenDashboard() => OnRequestOpenTab(new RequestOpenTabMessage("dashboard", "Dashboard"));
        private void OpenCompany() => OnRequestOpenTab(new RequestOpenTabMessage("company", "Company"));
        private void OpenUsers() => OnRequestOpenTab(new RequestOpenTabMessage("users", "Users"));
        private void OpenTemplates() => OnRequestOpenTab(new RequestOpenTabMessage("templates", "Templates"));
        private void OpenAppSettings() => OnRequestOpenTab(new RequestOpenTabMessage("appsettings", "App Settings"));

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
                _disposed = true;
            }
        }
    }
}
