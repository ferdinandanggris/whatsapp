using System.Threading.Tasks;
using System.Collections.Generic;
using WaDesktop.Domain.Entities;

namespace WaDesktop.Domain.Interfaces
{
    public interface IApiClient
    {
        Task<AuthResult> LoginAsync(string username, string password);
        Task LogoutAsync();

        Task<List<PhoneNumberNode>> GetPhoneNumbersAsync();
        Task<List<Company>> GetCompaniesAsync(string search = null);
        Task<List<User>> GetUsersAsync(string search = null);
        Task<List<Template>> GetTemplatesAsync(string search = null);
        Task<AppSetting> GetAppSettingsAsync();
        Task SaveAppSettingsAsync(AppSetting settings);
    }

    public class AuthResult
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public string Role { get; set; }
        public string DisplayName { get; set; }
    }
}
