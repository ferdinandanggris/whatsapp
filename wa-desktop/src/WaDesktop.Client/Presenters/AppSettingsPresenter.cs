using System;
using System.Linq;
using System.Threading.Tasks;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;

namespace WaDesktop.Client.Presenters
{
    public class AppSettingsPresenter : IDisposable
    {
        private readonly IAppSettingsView _view;
        private readonly IApiClient _api;
        private bool _disposed;

        public AppSettingsPresenter(IAppSettingsView view, IApiClient api)
        {
            _view = view;
            _api = api;

            _view.SaveClicked += async (s, e) => await SaveAsync();
            _view.RefreshClicked += async (s, e) => await LoadDataAsync();
        }

        public async void LoadData() => await LoadDataAsync();

        private async Task LoadDataAsync()
        {
            _view.IsSaving = true;
            try
            {
                var settings = await Task.Run(() => _api.GetAppSettingsAsync());
                _view.WebhookUrl = settings.WebhookUrl;
                _view.ApiKey = settings.ApiKey;
                _view.WabaId = settings.WabaId;
            }
            catch (Exception ex)
            {
                _view.ShowError($"Gagal load settings: {ex.Message}");
            }
            finally
            {
                _view.IsSaving = false;
            }
        }

        private async Task SaveAsync()
        {
            _view.IsSaving = true;
            try
            {
                var settings = new AppSetting
                {
                    WebhookUrl = _view.WebhookUrl,
                    ApiKey = _view.ApiKey,
                    WabaId = _view.WabaId
                };
                var warnings = await Task.Run(() => _api.SaveAppSettingsAsync(settings));
                if (warnings != null && warnings.Any())
                    _view.ShowWarning(string.Join("\n", warnings));
                else
                    _view.ShowSuccess("Settings saved.");
            }
            catch (Exception ex)
            {
                _view.ShowError($"Gagal save: {ex.Message}");
            }
            finally
            {
                _view.IsSaving = false;
            }
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _view.SaveClicked -= null;
                _view.RefreshClicked -= null;
                _disposed = true;
            }
        }
    }
}
