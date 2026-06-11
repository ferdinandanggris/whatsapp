using System;
using System.Threading.Tasks;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.State;

namespace WaDesktop.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly IApiClient _api;
        private readonly AppState _state;

        public AuthService(IApiClient api, AppState state)
        {
            _api = api;
            _state = state;

            // Sync AppState when ApiClient refreshes token internally
            _api.TokenRefreshed += (s, e) =>
            {
                _state.AccessToken = _api.AccessToken;
            };
        }

        public string AccessToken => _state.AccessToken;
        public string RefreshToken => _state.RefreshToken;
        public string Role => _state.Role;
        public string DisplayName => _state.DisplayName;
        public bool IsLoggedIn => _state.IsLoggedIn;
        public bool IsSuperAdmin => _state.IsSuperAdmin;

        public async Task<bool> LoginAsync(string username, string password)
        {
            try
            {
                var result = await _api.LoginAsync(username, password);
                _state.SetSession(result.AccessToken, result.RefreshToken, result.User.Role, result.User.DisplayName);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> RefreshTokenAsync()
        {
            try
            {
                // Handled internally by ApiClient.SendWithRefreshAsync → TryRefreshAsync
                return false;
            }
            catch
            {
                return false;
            }
        }

        public void Logout()
        {
            _state.ClearSession();
            _api.SetToken(null);
        }
    }
}
