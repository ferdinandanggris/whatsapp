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
                _state.SetSession(result.AccessToken, result.RefreshToken, result.Role, result.DisplayName);

                if (_api is ApiClient client)
                    client.SetToken(result.AccessToken);

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
                // Implement refresh API call in production
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
            if (_api is ApiClient client)
                client.SetToken(null);
        }
    }
}
