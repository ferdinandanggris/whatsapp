using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using WaDesktop.Domain.Entities;
using WaDesktop.Domain.Interfaces;

namespace WaDesktop.Infrastructure.Services
{
    public class ApiClient : IApiClient
    {
        private readonly HttpClient _http;
        private readonly string _baseUrl;
        private string _accessToken;
        private string _refreshToken;

        public event EventHandler SessionExpired;
        public event EventHandler TokenRefreshed;

        public string AccessToken => _accessToken;
        public string RefreshToken => _refreshToken;

        public ApiClient(string baseUrl = "http://localhost:8080")
        {
            _baseUrl = baseUrl;
            _http = new HttpClient();
        }

        public void SetToken(string token)
        {
            _accessToken = token;
            _http.DefaultRequestHeaders.Authorization =
                string.IsNullOrEmpty(token) ? null : new AuthenticationHeaderValue("Bearer", token);
        }

        public void SetSession(string accessToken, string refreshToken)
        {
            SetToken(accessToken);
            _refreshToken = refreshToken;
        }

        // ── Auth ──

        public async Task<AuthResult> LoginAsync(string username, string password)
        {
            var body = JsonConvert.SerializeObject(new { username, password });
            var res = await _http.PostAsync($"{_baseUrl}/api/v1/auth/login",
                new StringContent(body, Encoding.UTF8, "application/json"));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Login failed: {err}");
            }

            var json = await res.Content.ReadAsStringAsync();
            var result = UnwrapData<AuthResult>(json);
            if (result != null)
                SetSession(result.AccessToken, result.RefreshToken);
            return result;
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
        }

        public async Task<List<PhoneNumberDetail>> GetPhoneNumberListAsync(string wabaId = null)
        {
            var url = "/api/v1/phone-numbers";
            if (!string.IsNullOrEmpty(wabaId))
            {
                url += $"?waba_id={wabaId}";
            }
            return await GetListAsync<PhoneNumberDetail>(url);
        }

        // ── Companies ──

        public async Task<List<Company>> GetCompaniesAsync(string search = null)
        {
            var data = await GetListAsync<Company>("/api/v1/companies");
            if (!string.IsNullOrEmpty(search))
                data = data.Where(c => c.Name.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
            return data;
        }

        public async Task<Company> CreateCompanyAsync(string name)
        {
            var body = JsonConvert.SerializeObject(new { name });
            var res = await SendWithRefreshAsync(() =>
                _http.PostAsync($"{_baseUrl}/api/v1/companies",
                    new StringContent(body, Encoding.UTF8, "application/json")));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Create company failed: {err}");
            }

            var json = await res.Content.ReadAsStringAsync();
            return UnwrapData<Company>(json);
        }

        public async Task<Company> GetBillingAnalyticsAsync()
        {
            var json = await GetStringAsync("/api/v1/analytics/billing");
            return UnwrapData<Company>(json);
        }

        public async Task<Company> UpdateCompanyAsync(string id, string name, int? limitMarketing = null, int? limitUtility = null, int? limitAuth = null, int? limitService = null)
        {
            var body = JsonConvert.SerializeObject(new { 
                name,
                limit_marketing = limitMarketing,
                limit_utility = limitUtility,
                limit_authentication = limitAuth,
                limit_service = limitService
            });
            var res = await SendWithRefreshAsync(() =>
                _http.PutAsync($"{_baseUrl}/api/v1/companies/{id}",
                    new StringContent(body, Encoding.UTF8, "application/json")));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Update company failed: {err}");
            }

            return null;
        }

        public async Task DeleteCompanyAsync(string id)
        {
            var res = await SendWithRefreshAsync(() =>
                _http.DeleteAsync($"{_baseUrl}/api/v1/companies/{id}"));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Delete company failed: {err}");
            }
        }

        // ── Users ──

        public async Task<List<User>> GetUsersAsync(string search = null)
        {
            var json = await GetStringAsync("/api/v1/users");
            var data = UnwrapData<List<User>>(json) ?? new List<User>();
            if (!string.IsNullOrEmpty(search))
                data = data.Where(u => u.DisplayName.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0
                    || u.Username.IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
            return data;
        }

        public async Task<User> CreateUserAsync(string username, string password, string name, string role, string companyId)
        {
            var body = JsonConvert.SerializeObject(new { username, password, name, role, company_id = companyId });
            var res = await SendWithRefreshAsync(() =>
                _http.PostAsync($"{_baseUrl}/api/v1/users",
                    new StringContent(body, Encoding.UTF8, "application/json")));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Create user failed: {err}");
            }

            var json = await res.Content.ReadAsStringAsync();
            return UnwrapData<User>(json);
        }

        public async Task UpdateUserAsync(string id, string displayName, string role, string companyId, bool? isActive = null)
        {
            var body = JsonConvert.SerializeObject(new {name = displayName, role, company_id = companyId, is_active = isActive });
            var res = await SendWithRefreshAsync(() =>
                _http.PutAsync($"{_baseUrl}/api/v1/users/{id}",
                    new StringContent(body, Encoding.UTF8, "application/json")));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Update user failed: {err}");
            }
        }

        public async Task DeactivateUserAsync(string id)
        {
            var req = new HttpRequestMessage(new HttpMethod("PATCH"), $"{_baseUrl}/api/v1/users/{id}/deactivate");
            var res = await SendWithRefreshAsync(() => _http.SendAsync(req));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Deactivate user failed: {err}");
            }
        }

        public async Task ResetPasswordAsync(string id, string newPassword)
        {
            var body = JsonConvert.SerializeObject(new { new_password = newPassword });
            var res = await SendWithRefreshAsync(() =>
                _http.PostAsync($"{_baseUrl}/api/v1/users/{id}/reset-password",
                    new StringContent(body, Encoding.UTF8, "application/json")));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Reset password failed: {err}");
            }
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
                    case "wa_waba_token":   setting.WabaToken = item.Value; break;
                    case "wa_app_id":       setting.AppId = item.Value; break;
                    case "wa_bussiness_id": setting.BusinessId = item.Value; break;
                    case "wa_verify_token": setting.VerifyToken = item.Value; break;
                }
            }
            return setting;
        }

        public async Task<List<string>> SaveAppSettingsAsync(AppSetting settings)
        {
            var payload = new Dictionary<string, string>();
            if (!string.IsNullOrEmpty(settings.WabaToken))   payload["wa_waba_token"] = settings.WabaToken;
            if (!string.IsNullOrEmpty(settings.AppId))       payload["wa_app_id"] = settings.AppId;
            if (!string.IsNullOrEmpty(settings.BusinessId))  payload["wa_bussiness_id"] = settings.BusinessId;
            if (!string.IsNullOrEmpty(settings.VerifyToken)) payload["wa_verify_token"] = settings.VerifyToken;

            var body = JsonConvert.SerializeObject(payload);
            var res = await SendWithRefreshAsync(() =>
                _http.PutAsync($"{_baseUrl}/api/v1/settings",
                    new StringContent(body, Encoding.UTF8, "application/json")));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Save settings failed ({res.StatusCode}): {err}");
            }

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
            return UnwrapData<PhoneNumberDetail>(json);
        }

        public async Task<byte[]> GetPhoneProfilePictureAsync(string url)
        {
            var absoluteUrl = url.StartsWith("http://") || url.StartsWith("https://") ? url : $"{_baseUrl}{url}";
            var res = await SendWithRefreshAsync(() => _http.GetAsync(absoluteUrl));
            if (res.StatusCode == System.Net.HttpStatusCode.NotFound)
                return null;
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Request failed ({res.StatusCode}): {body}");
            }
            return await res.Content.ReadAsByteArrayAsync();
        }

        public async Task<SavePhoneResult> SavePhoneDetailAsync(string phoneNumberId, string displayName, string description, string email, string about, string address, string vertical, List<string> websites)
        {
            if (websites != null && websites.Count > 2)
                websites = websites.GetRange(0, 2);

            var payload = new
            {
                display_name = displayName,
                description,
                email,
                about,
                address,
                vertical,
                websites
            };
            var body = JsonConvert.SerializeObject(payload);
            var res = await SendWithRefreshAsync(() =>
                _http.PutAsync($"{_baseUrl}/api/v1/phone-numbers/{phoneNumberId}",
                    new StringContent(body, Encoding.UTF8, "application/json")));

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
            var res = await SendWithRefreshAsync(() =>
                _http.PostAsync($"{_baseUrl}/api/v1/phone-numbers/{phoneNumberId}/sync-profile", null));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Sync failed ({res.StatusCode}): {err}");
            }
            var json = await res.Content.ReadAsStringAsync();
            return UnwrapData<PhoneNumberDetail>(json);
        }

        public async Task SyncPhoneNumbersFromMetaAsync(string wabaId)
        {
            var content = new StringContent(
                JsonConvert.SerializeObject(new { waba_id = wabaId }),
                Encoding.UTF8,
                "application/json");

            var res = await SendWithRefreshAsync(() =>
                _http.PostAsync($"{_baseUrl}/api/v1/phone-numbers/sync", content));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Sync failed ({res.StatusCode}): {err}");
            }
        }

        public async Task<PhoneNumberDetail> UploadPhonePictureAsync(string phoneNumberId, string filePath)
        {
            var bytes = System.IO.File.ReadAllBytes(filePath);
            var fileName = System.IO.Path.GetFileName(filePath);
            using (var form = new System.Net.Http.MultipartFormDataContent())
            {
                // Harus bernama "file" agar sesuai dengan backend Golang
                var fileContent = new System.Net.Http.ByteArrayContent(bytes);
                // Tambahkan content type manual jika diperlukan, tapi ini biasanya otomatis dideteksi
                form.Add(fileContent, "file", fileName);
                
                var res = await SendWithRefreshAsync(() =>
                    _http.PostAsync($"{_baseUrl}/api/v1/phone-numbers/{phoneNumberId}/profile-picture", form));

                if (!res.IsSuccessStatusCode)
                {
                    var body = await res.Content.ReadAsStringAsync();
                    throw new HttpRequestException($"Upload failed ({res.StatusCode}): {body}");
                }
                var json = await res.Content.ReadAsStringAsync();
                return UnwrapData<PhoneNumberDetail>(json);
            }
        }

        // ── WABA ──

        public async Task<List<Waba>> GetWabasAsync()
        {
            return await GetListAsync<Waba>("/api/v1/waba");
        }

        public async Task SyncWabasFromMetaAsync()
        {
            var res = await SendWithRefreshAsync(() =>
                _http.PostAsync($"{_baseUrl}/api/v1/waba/sync", null));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Sync failed ({res.StatusCode}): {err}");
            }
        }

        public async Task UpdateWabaAsync(string wabaId, string companyId)
        {
            var body = JsonConvert.SerializeObject(new { company_id = companyId });
            var res = await SendWithRefreshAsync(() =>
                _http.PutAsync($"{_baseUrl}/api/v1/waba/{wabaId}",
                    new StringContent(body, Encoding.UTF8, "application/json")));

            if (!res.IsSuccessStatusCode)
            {
                var err = await res.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Update failed ({res.StatusCode}): {err}");
            }
        }

        // ── Helpers ──

        private async Task<string> GetStringAsync(string path)
        {
            var res = await SendWithRefreshAsync(() => _http.GetAsync($"{_baseUrl}{path}"));
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

        private async Task<bool> TryRefreshAsync()
        {
            if (string.IsNullOrEmpty(_refreshToken))
                return false;

            try
            {
                var payload = new { refresh_token = _refreshToken };
                var body = JsonConvert.SerializeObject(payload);
                // Use separate client to avoid auth header interference
                using (var refreshHttp = new HttpClient())
                {
                    var res = await refreshHttp.PostAsync($"{_baseUrl}/api/v1/auth/refresh",
                        new StringContent(body, Encoding.UTF8, "application/json"));
                    if (!res.IsSuccessStatusCode)
                        return false;

                    var json = await res.Content.ReadAsStringAsync();
                    var result = UnwrapData<AuthResult>(json);
                    if (result == null || string.IsNullOrEmpty(result.AccessToken))
                        return false;

                    SetSession(result.AccessToken, result.RefreshToken ?? _refreshToken);
                    TokenRefreshed?.Invoke(this, EventArgs.Empty);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        private async Task<HttpResponseMessage> SendWithRefreshAsync(Func<Task<HttpResponseMessage>> send)
        {
            var res = await send();
            if ((int)res.StatusCode == 401 && await TryRefreshAsync())
            {
                res = await send();
                if ((int)res.StatusCode == 401)
                {
                    FireSessionExpired();
                    throw new HttpRequestException("Session expired");
                }
            }
            return res;
        }

        private void FireSessionExpired()
        {
            _accessToken = null;
            _refreshToken = null;
            SetToken(null);
            SessionExpired?.Invoke(this, EventArgs.Empty);
        }

        private class ApiListResponse<T>
        {
            [JsonProperty("data")]
            public List<T> Data { get; set; }
        }

        private static T UnwrapData<T>(string json)
        {
            var wrapper = JObject.Parse(json);
            var data = wrapper["data"];
            return data != null ? data.ToObject<T>() : default;
        }
    }
}
