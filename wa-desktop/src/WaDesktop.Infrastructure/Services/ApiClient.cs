using System;
using System.Collections.Generic;
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
            return JsonConvert.DeserializeObject<AuthResult>(json);
        }

        public Task LogoutAsync() => Task.CompletedTask;

        public async Task<List<PhoneNumberNode>> GetPhoneNumbersAsync()
        {
            var json = await _http.GetStringAsync($"{_baseUrl}/api/v1/phone-numbers");
            return JsonConvert.DeserializeObject<List<PhoneNumberNode>>(json) ?? new List<PhoneNumberNode>();
        }

        public async Task<List<Company>> GetCompaniesAsync(string search = null)
        {
            var url = $"{_baseUrl}/api/v1/companies";
            if (!string.IsNullOrEmpty(search)) url += $"?q={Uri.EscapeDataString(search)}";
            var json = await _http.GetStringAsync(url);
            return JsonConvert.DeserializeObject<List<Company>>(json) ?? new List<Company>();
        }

        public async Task<List<User>> GetUsersAsync(string search = null)
        {
            var url = $"{_baseUrl}/api/v1/users";
            if (!string.IsNullOrEmpty(search)) url += $"?q={Uri.EscapeDataString(search)}";
            var json = await _http.GetStringAsync(url);
            return JsonConvert.DeserializeObject<List<User>>(json) ?? new List<User>();
        }

        public async Task<List<Template>> GetTemplatesAsync(string search = null)
        {
            var url = $"{_baseUrl}/api/v1/templates";
            if (!string.IsNullOrEmpty(search)) url += $"?q={Uri.EscapeDataString(search)}";
            var json = await _http.GetStringAsync(url);
            return JsonConvert.DeserializeObject<List<Template>>(json) ?? new List<Template>();
        }

        public async Task<AppSetting> GetAppSettingsAsync()
        {
            var json = await _http.GetStringAsync($"{_baseUrl}/api/v1/settings");
            return JsonConvert.DeserializeObject<AppSetting>(json) ?? new AppSetting();
        }

        public async Task SaveAppSettingsAsync(AppSetting settings)
        {
            var body = JsonConvert.SerializeObject(settings);
            var res = await _http.PutAsync($"{_baseUrl}/api/v1/settings",
                new StringContent(body, Encoding.UTF8, "application/json"));
            res.EnsureSuccessStatusCode();
        }
    }
}
