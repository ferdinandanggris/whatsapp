using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Domain.Messages;

namespace WaDesktop.Client.Presenters
{
    public class SidebarPresenter : IDisposable
    {
        private readonly ISidebarView _view;
        private readonly IApiClient _api;
        private readonly IEventAggregator _bus;
        private bool _disposed;

        public SidebarPresenter(ISidebarView view, IApiClient api, IEventAggregator bus)
        {
            _view = view;
            _api = api;
            _bus = bus;

            _view.PhoneNumberSelected += OnPhoneNumberSelected;
            _view.SyncFromMetaRequested += OnSyncFromMetaRequested;
            _view.RefreshRequested += OnRefreshRequested;
        }

        public async Task LoadDataAsync()
        {
            _view.IsLoading = true;
            try
            {
                var phones = await Task.Run(() => _api.GetPhoneNumbersAsync());
                _view.LoadPhoneNumbers(BuildTree(phones));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Failed to load phone numbers: {ex.Message}");
            }
            finally
            {
                _view.IsLoading = false;
            }
        }

        private async void OnSyncFromMetaRequested(object sender, EventArgs e)
        {
            _view.IsLoading = true;
            try
            {
                await Task.Run(() => _api.SyncPhoneNumbersFromMetaAsync());
                await LoadDataAsync();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Gagal sinkron dari Meta: {ex.Message}", "Sinkron Gagal",
                    MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            finally
            {
                _view.IsLoading = false;
            }
        }

        private async void OnRefreshRequested(object sender, EventArgs e)
        {
            await LoadDataAsync();
        }

        private static IList<PhoneNumberNode> BuildTree(List<PhoneNumberNode> phones)
        {
            var root = new PhoneNumberNode { DisplayName = "Phone Numbers" };
            foreach (var p in phones.OrderBy(p => p.DisplayName))
                root.Children.Add(p);
            return new[] { root };
        }

        private void OnPhoneNumberSelected(object sender, PhoneNumberSelectedEventArgs e)
        {
            // Only leaf phone numbers (with PhoneNumberId) trigger tab open
            if (string.IsNullOrEmpty(e.PhoneNumberId)) return;
            var key = $"phonedetail_{e.PhoneNumberId}";
            _bus.Publish(new RequestOpenTabMessage(key, e.DisplayName ?? e.WaId));
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _view.PhoneNumberSelected -= OnPhoneNumberSelected;
                _view.SyncFromMetaRequested -= OnSyncFromMetaRequested;
                _view.RefreshRequested -= OnRefreshRequested;
                _disposed = true;
            }
        }
    }
}
