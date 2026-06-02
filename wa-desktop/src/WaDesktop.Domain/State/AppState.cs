using WaDesktop.Domain.Entities;

namespace WaDesktop.Domain.State
{
    /// <summary>Single source of truth untuk state global aplikasi.</summary>
    public class AppState
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public string Role { get; set; }
        public string DisplayName { get; set; }
        public bool IsLoggedIn => !string.IsNullOrEmpty(AccessToken);
        public bool IsSuperAdmin => Role == "super_admin";

        public void SetSession(string accessToken, string refreshToken, string role, string displayName)
        {
            AccessToken = accessToken;
            RefreshToken = refreshToken;
            Role = role;
            DisplayName = displayName;
        }

        public void ClearSession()
        {
            AccessToken = null;
            RefreshToken = null;
            Role = null;
            DisplayName = null;
        }
    }
}
