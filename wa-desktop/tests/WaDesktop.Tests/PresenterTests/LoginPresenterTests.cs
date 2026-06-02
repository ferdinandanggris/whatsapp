using NUnit.Framework;
using System;
using System.Threading.Tasks;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.State;
using WaDesktop.Domain.Messages;
using WaDesktop.Client.Presenters;
using WaDesktop.Infrastructure.EventAggregator;

namespace WaDesktop.Tests.PresenterTests
{
    [TestFixture]
    public class LoginPresenterTests
    {
        private class FakeLoginView : ILoginView
        {
            public string Username { get; set; }
            public string Password { get; set; }
            public bool IsLoading { get; set; }
            public bool InvokeRequired => false;
            public string LastError { get; private set; }
            public bool IsClosed { get; private set; }
            public event EventHandler LoginClicked;

            public void InvokeIfRequired(Action action) => action();
            public void ShowError(string message) => LastError = message;
            public void Close() => IsClosed = true;
            public void TriggerLogin() => LoginClicked?.Invoke(this, EventArgs.Empty);
        }

        private class FakeAuthService : IAuthService
        {
            public bool LoginResult { get; set; } = true;
            public string AccessToken => "token";
            public string RefreshToken => "rtoken";
            public string Role => "admin";
            public string DisplayName => "Test User";
            public bool IsLoggedIn => true;
            public bool IsSuperAdmin => false;

            public Task<bool> LoginAsync(string username, string password) => Task.FromResult(LoginResult);
            public Task<bool> RefreshTokenAsync() => Task.FromResult(true);
            public void Logout() { }
        }

        [Test]
        public async Task Login_Success_PublishesMessageAndCloses()
        {
            var view = new FakeLoginView { Username = "admin", Password = "pass" };
            var auth = new FakeAuthService { LoginResult = true };
            var bus = new EventAggregator();
            LoginCompletedMessage received = null;
            bus.Subscribe<LoginCompletedMessage>(m => received = m);

            var presenter = new global::WaDesktop.Client.Presenters.LoginPresenter(view, auth, bus);

            view.TriggerLogin();
            await Task.Delay(100); // wait for async

            Assert.That(received, Is.Not.Null);
            Assert.That(received.DisplayName, Is.EqualTo("Test User"));
            Assert.That(view.IsClosed, Is.True);
            presenter.Dispose();
        }

        [Test]
        public async Task Login_Failure_ShowsError()
        {
            var view = new FakeLoginView { Username = "bad", Password = "bad" };
            var auth = new FakeAuthService { LoginResult = false };
            var bus = new EventAggregator();

            var presenter = new global::WaDesktop.Client.Presenters.LoginPresenter(view, auth, bus);

            view.TriggerLogin();
            await Task.Delay(100);

            Assert.That(view.LastError, Does.Contain("gagal"));
            Assert.That(view.IsClosed, Is.False);
            presenter.Dispose();
        }
    }
}
