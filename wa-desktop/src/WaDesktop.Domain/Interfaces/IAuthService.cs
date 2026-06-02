using System.Threading.Tasks;

namespace WaDesktop.Domain.Interfaces
{
    public interface IAuthService
    {
        string AccessToken { get; }
        string RefreshToken { get; }
        string Role { get; }
        string DisplayName { get; }
        bool IsLoggedIn { get; }
        bool IsSuperAdmin { get; }

        Task<bool> LoginAsync(string username, string password);
        Task<bool> RefreshTokenAsync();
        void Logout();
    }
}
