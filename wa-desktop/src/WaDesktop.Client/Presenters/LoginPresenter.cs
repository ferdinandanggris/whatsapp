using System;
using System.Threading.Tasks;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Messages;
using WaDesktop.Client.Extensions;

namespace WaDesktop.Client.Presenters
{
    public class LoginPresenter : IDisposable
    {
        private readonly ILoginView _view;
        private readonly IAuthService _auth;
        private readonly IEventAggregator _bus;
        private bool _disposed;

        public LoginPresenter(ILoginView view, IAuthService auth, IEventAggregator bus)
        {
            _view = view;
            _auth = auth;
            _bus = bus;

            _view.LoginClicked += OnLoginClicked;
        }

        private async void OnLoginClicked(object sender, EventArgs e)
        {
            _view.IsLoading = true;
            try
            {
                var success = await Task.Run(() => _auth.LoginAsync(_view.Username, _view.Password));
                if (success)
                {
                    _bus.Publish(new LoginCompletedMessage(_auth.DisplayName, _auth.Role));
                    _view.Close();
                }
                else
                {
                    _view.ShowError("Login gagal. Periksa username/password.");
                }
            }
            catch (Exception ex)
            {
                _view.ShowError($"Koneksi gagal: {ex.Message}");
            }
            finally
            {
                _view.IsLoading = false;
            }
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _view.LoginClicked -= OnLoginClicked;
                _disposed = true;
            }
        }
    }

    public interface ILoginView : IViewBase
    {
        string Username { get; }
        string Password { get; }
        bool IsLoading { set; }
        event EventHandler LoginClicked;
        void ShowError(string message);
        void Close();
    }
}
