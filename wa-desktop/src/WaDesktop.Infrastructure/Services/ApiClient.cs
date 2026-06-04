using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using WaDesktop.Domain.Entities;
using WaDesktop.Domain.Interfaces;

namespace WaDesktop.Infrastructure.Services
{
    public class ApiClient : IApiClient
    {
        private readonly HttpClient _http;
        private readonly string _baseUrl;

        public event EventHandler SessionExpired;

        public ApiClient(string baseUrl = "http://localhost:8080")
        {
            _baseUrl = baseUrl;
            _http = new HttpClient();
        }

        public void SetToken(string token)
        {
            _http.DefaultRequestHeaders.Authorization =
                string.IsNullOrEmpty(token) ? null : new AuthenticationHeaderValue("Bearer", token);
        }

        // ── Auth ──

        public async Task<AuthResult> LoginAsync(string email, string password)
        {
            var body = JsonConvert.SerializeObject(new { email, password });
            var res = await _http.PostAsync($"{_baseUrl}/api/v1/auth/login",
                new StringContent(body, Encoding.UTF8, "application/json"));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Login failed: {err}");
            }

            var json = await res.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<AuthResult>(json);
        }

        public Task LogoutAsync() => Task.CompletedTask;

        // ── Phone Numbers ──

        public async Task<List<PhoneNumberNode>> GetPhoneNumbersAsync()
        {
            var json = await GetStringAsync("/api/v1/phone-numbers");
            var items = JsonConvert.DeserializeObject<List<PhoneNumberDto>>(json) ?? new List<PhoneNumberDto>();
            return items.Select(dto => new PhoneNumberNode
            {
                PhoneNumberId = dto.PhoneNumberId,
                DisplayName = dto.DisplayName,
                DisplayPhoneNumber = dto.DisplayPhone,
                CompanyId = dto.CompanyId,
                CompanyName = dto.CompanyName,
            }).ToList();
        }

        private class PhoneNumberDto
        {
            [JsonProperty("phone_number_id")]
            public string PhoneNumberId { get; set; }
            [JsonProperty("display_name")]
            public string DisplayName { get; set; }
            [JsonProperty("display_phone_number")]
            public string DisplayPhone { get; set; }
            [JsonProperty("company_id")]
            public long? CompanyId { get; set; }
            [JsonProperty("company_name")]
            public string CompanyName { get; set; }
        }

        // ── Companies ──

        public async Task<List<Company>> GetCompaniesAsync(string search = null)
        {
            var data = await GetListAsync<Company>("/api/v1/companies");
            if (!string.IsNullOrEmpty(search))
                data = data.Where(c => c.Name.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
            return data;
        }

        // ── Users ──

        public async Task<List<User>> GetUsersAsync(string search = null)
        {
            var json = await GetStringAsync("/api/v1/users");
            var data = JsonConvert.DeserializeObject<List<User>>(json) ?? new List<User>();
            if (!string.IsNullOrEmpty(search))
                data = data.Where(u => u.DisplayName.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0
                    || u.Email.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
            return data;
        }

        // ── Templates ──

        public async Task<List<Template>> GetTemplatesAsync(string search = null)
        {
            var data = await GetListAsync<Template>("/api/v1/templates");
            if (!string.IsNullOrEmpty(search))
                data = data.Where(t => t.Name.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
            return data;
        }

        // ── Settings ──

        public async Task<AppSetting> GetAppSettingsAsync()
        {
            var data = await GetListAsync<SettingItem>("/api/v1/settings");
            var setting = new AppSetting();
            foreach (var item in data)
            {
                switch (item.Name)
                {
                    case "webhook_url":  setting.WebhookUrl = item.Value; break;
                    case "api_key":      setting.ApiKey = item.Value; break;
                    case "waba_id":      setting.WabaId = item.Value; break;
                }
            }
            return setting;
        }

        public async Task<List<string>> SaveAppSettingsAsync(AppSetting settings)
        {
            var payload = new Dictionary<string, string>();
            if (!string.IsNullOrEmpty(settings.WebhookUrl)) payload["webhook_url"] = settings.WebhookUrl;
            if (!string.IsNullOrEmpty(settings.ApiKey))     payload["api_key"] = settings.ApiKey;
            if (!string.IsNullOrEmpty(settings.WabaId))     payload["waba_id"] = settings.WabaId;

            var body = JsonConvert.SerializeObject(payload);
            var res = await _http.PutAsync($"{_baseUrl}/api/v1/settings",
                new StringContent(body, Encoding.UTF8, "application/json"));

            if ((int)res.StatusCode == 401) { FireSessionExpired(); throw new HttpRequestException("Session expired"); }
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var wrapped = JsonConvert.DeserializeObject<SaveSettingsResponse>(json);
            return wrapped?.Warnings ?? new List<string>();
        }

        private class SaveSettingsResponse
        {
            [JsonProperty("warnings")]
            public List<string> Warnings { get; set; }
        }

        private class SettingItem
        {
            [JsonProperty("name")]
            public string Name { get; set; }
            [JsonProperty("value")]
            public string Value { get; set; }
        }

        // ── Phone Details ──

        public async Task<PhoneNumberDetail> GetPhoneDetailAsync(string phoneNumberId)
        {
            var json = await GetStringAsync($"/api/v1/phone-numbers/{phoneNumberId}");
            return JsonConvert.DeserializeObject<PhoneNumberDetail>(json);
        }

        public async Task<byte[]> GetPhoneProfilePictureAsync(string url)
        {
            var res = await _http.GetAsync($"{_baseUrl}{url}");
            if ((int)res.StatusCode == 401) { FireSessionExpired(); throw new HttpRequestException("Session expired"); }
            if (res.StatusCode == System.Net.HttpStatusCode.NotFound)
                return null; // No picture
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Request failed ({res.StatusCode}): {body}");
            }
            return await res.Content.ReadAsByteArrayAsync();
        }

        public async Task<PhoneNumberDetail> SavePhoneDetailAsync(string phoneNumberId, string displayName, string description, long? companyId, string email, string about, string address, string vertical, string websitesText)
        {
            var websites = new List<string>();
            foreach (var line in (websitesText ?? "").Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
            {
                var trimmed = line.Trim();
                if (trimmed.Length > 0)
                    websites.Add(trimmed);
            }
            if (websites.Count == 0) websites = null;

            var payload = new
            {
                display_name = displayName,
                description,
                company_id = companyId,
                email,
                about,
                address,
                vertical,
                websites
            };
            var body = JsonConvert.SerializeObject(payload);
            var res = await _http.PutAsync($"{_baseUrl}/api/v1/phone-numbers/{phoneNumberId}",
                new StringContent(body, Encoding.UTF8, "application/json"));
            if ((int)res.StatusCode == 401) { FireSessionExpired(); throw new HttpRequestException("Session expired"); }
            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Save failed ({res.StatusCode}): {err}");
            }
            var json = await res.Content.ReadAsStringAsync();
            var wrapped = JsonConvert.DeserializeObject<SavePhoneResponse>(json);
            return new SavePhoneResult { Detail = wrapped?.Data, Warnings = wrapped?.Warnings ?? new List<string>() };
        }

        private class SavePhoneResponse
        {
            [JsonProperty("data")]
            public PhoneNumberDetail Data { get; set; }
            [JsonProperty("warnings")]
            public List<string> Warnings { get; set; }
        }

        public async Task<PhoneNumberDetail> SyncPhoneProfileAsync(string phoneNumberId)
        {
            var res = await _http.PostAsync($"{_baseUrl}/api/v1/phone-numbers/{phoneNumberId}/sync-profile", null);
            if ((int)res.StatusCode == 401) { FireSessionExpired(); throw new HttpRequestException("Session expired"); }
            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Sync failed ({res.StatusCode}): {err}");
            }
            var json = await res.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject<PhoneNumberDetail>(json);
        }

        public async Task<PhoneNumberDetail> UploadPhonePictureAsync(string phoneNumberId, string filePath)
        {
            var bytes = System.IO.File.ReadAllBytes(filePath);
            var fileName = System.IO.Path.GetFileName(filePath);
            using (var form = new System.Net.Http.MultipartFormDataContent())
            {
                form.Add(new System.Net.Http.ByteArrayContent(bytes), "photo", fileName);
                var res = await _http.PostAsync($"{_baseUrl}/api/v1/phone-numbers/{phoneNumberId}/profile-picture", form);
                if ((int)res.StatusCode == 401) { FireSessionExpired(); throw new HttpRequestException("Session expired"); }
                if (!res.IsSuccessStatusCode)
                {
                    var body = await res.Content.ReadAsStringAsync();
                    throw new HttpRequestException($"Upload failed ({res.StatusCode}): {body}");
                }
                var json = await res.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<PhoneNumberDetail>(json);
            }
        }

        // ── Helpers ──

        private async Task<string> GetStringAsync(string path)
        {
            var res = await _http.GetAsync($"{_baseUrl}{path}");
            if ((int)res.StatusCode == 401) { FireSessionExpired(); throw new HttpRequestException("Session expired"); }
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Request failed ({res.StatusCode}): {body}");
            }
            return await res.Content.ReadAsStringAsync();
        }

        private async Task<List<T>> GetListAsync<T>(string path)
        {
            var json = await GetStringAsync(path);
            var wrapped = JsonConvert.DeserializeObject<ApiListResponse<T>>(json);
            return wrapped?.Data ?? new List<T>();
        }

        private void FireSessionExpired()
        {
            SetToken(null);
            SessionExpired?.Invoke(this, EventArgs.Empty);
        }

        private class ApiListResponse<T>
        {
            [JsonProperty("data")]
            public List<T> Data { get; set; }
        }
    }
}
