using NUnit.Framework;
using System;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.State;
using WaDesktop.Domain.Messages;
using WaDesktop.Infrastructure.EventAggregator;

namespace WaDesktop.Tests.PresenterTests
{
    [TestFixture]
    public class ShellPresenterTests
    {
        private class FakeAuthService : IAuthService
        {
            public string AccessToken => "token";
            public string RefreshToken => "rtoken";
            public string Role => "admin";
            public string DisplayName => "Test User";
            public bool IsLoggedIn => true;
            public bool IsSuperAdmin => false;

            public System.Threading.Tasks.Task<bool> LoginAsync(string username, string password)
                => System.Threading.Tasks.Task.FromResult(true);
            public System.Threading.Tasks.Task<bool> RefreshTokenAsync()
                => System.Threading.Tasks.Task.FromResult(true);
            public void Logout() { }
        }

        private class FakeShellView : IShellView
        {
            public string StatusText { get; set; }
            public bool AppSettingsVisible { get; set; }
            public bool InvokeRequired => false;
            public event EventHandler DashboardClicked;
            public event EventHandler CompanyClicked;
            public event EventHandler UsersClicked;
            public event EventHandler TemplatesClicked;
            public event EventHandler AppSettingsClicked;
            public event EventHandler LogoutClicked;

            public void AddOrSelectTab(string key, string title, IViewBase content) { }
            public void CloseTab(string key) { }
            public void ClearTabs() { }
            public void ShowNotification(string title, string body) { }
            public void SetBadge(int count) { }

            public void TriggerDashboard() => DashboardClicked?.Invoke(this, EventArgs.Empty);
            public void TriggerLogout() => LogoutClicked?.Invoke(this, EventArgs.Empty);
        }

        [Test]
        public void Constructor_SetsStatusText()
        {
            var view = new FakeShellView();
            var auth = new FakeAuthService();
            var bus = new EventAggregator();
            var state = new AppState();
            state.SetSession("t", "rt", "admin", "Test");

            var presenter = new global::WaDesktop.Client.Presenters.ShellPresenter(view, auth, bus, state, "http://localhost:5000");

            Assert.That(view.StatusText, Does.Contain("Test"));
            presenter.Dispose();
        }

        [Test]
        public void Logout_ClearsSession()
        {
            var view = new FakeShellView();
            var auth = new FakeAuthService();
            var bus = new EventAggregator();
            var state = new AppState();
            state.SetSession("t", "rt", "admin", "Test");

            var presenter = new global::WaDesktop.Client.Presenters.ShellPresenter(view, auth, bus, state, "http://localhost:5000");

            view.TriggerLogout();

            Assert.That(state.IsLoggedIn, Is.False);
            presenter.Dispose();
        }
    }
}
