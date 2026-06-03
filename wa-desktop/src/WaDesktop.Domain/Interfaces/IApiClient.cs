using System.Threading.Tasks;
using System.Collections.Generic;
using WaDesktop.Domain.Entities;
using Newtonsoft.Json;

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
        [JsonProperty("access_token")]
        public string AccessToken { get; set; }
        [JsonProperty("refresh_token")]
        public string RefreshToken { get; set; }
        [JsonProperty("user")]
        public User User { get; set; }
    }
}
