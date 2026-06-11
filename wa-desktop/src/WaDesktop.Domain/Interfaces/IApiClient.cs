using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using WaDesktop.Domain.Entities;
using Newtonsoft.Json;

namespace WaDesktop.Domain.Interfaces
{
    public interface IApiClient
    {
        /// <summary>Fired when any API call gets a 401 — session expired.</summary>
        event EventHandler SessionExpired;
        /// <summary>Fired after a successful silent token refresh.</summary>
        event EventHandler TokenRefreshed;
        string AccessToken { get; }
        void SetToken(string token);
        void SetSession(string accessToken, string refreshToken);
        Task<AuthResult> LoginAsync(string username, string password);
        Task LogoutAsync();

        Task<List<PhoneNumberNode>> GetPhoneNumbersAsync();
        Task<List<Company>> GetCompaniesAsync(string search = null);
        Task<Company> CreateCompanyAsync(string name);
        Task<Company> UpdateCompanyAsync(long id, string name);
        Task DeleteCompanyAsync(long id);
        Task<List<User>> GetUsersAsync(string search = null);
        Task<User> CreateUserAsync(string email, string password, string displayName, string role, long? companyId);
        Task UpdateUserAsync(string id, string displayName, string role, long? companyId, bool? isActive = null);
        Task DeactivateUserAsync(string id);
        Task ResetPasswordAsync(string id, string newPassword);
        Task<List<Template>> GetTemplatesAsync(string search = null);
        Task<AppSetting> GetAppSettingsAsync();
        Task<List<string>> SaveAppSettingsAsync(AppSetting settings);

        Task<PhoneNumberDetail> GetPhoneDetailAsync(string phoneNumberId);
        Task<SavePhoneResult> SavePhoneDetailAsync(string phoneNumberId, string displayName, string description, long? companyId, string email, string about, string address, string vertical, List<string> websites);
        Task<PhoneNumberDetail> SyncPhoneProfileAsync(string phoneNumberId);
        Task SyncPhoneNumbersFromMetaAsync();
        Task<PhoneNumberDetail> UploadPhonePictureAsync(string phoneNumberId, string filePath);
        Task<byte[]> GetPhoneProfilePictureAsync(string url);
    }

    public class SavePhoneResult
    {
        [JsonProperty("data")]
        public PhoneNumberDetail Detail { get; set; }
        [JsonProperty("warnings")]
        public List<string> Warnings { get; set; }
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
