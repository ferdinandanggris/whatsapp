using System;
using System.Threading.Tasks;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Domain.Messages;
using System.Collections.Generic;

namespace WaDesktop.Client.Presenters
{
    public class PhoneNumbersPresenter : IDisposable
    {
        private readonly IManagementView<PhoneNumberDetail> _view;
        private readonly IApiClient _api;
        private readonly IEventAggregator _bus;
        private List<PhoneNumberDetail> _data;
        private bool _disposed;

        public PhoneNumbersPresenter(IManagementView<PhoneNumberDetail> view, IApiClient api, IEventAggregator bus)
        {
            _view = view;
            _api = api;
            _bus = bus;

            _view.RefreshClicked += async (s, e) => await LoadDataAsync();
            _view.SearchClicked += async (s, q) => await LoadDataAsync(q);
            _view.AddClicked += OnAdd;
            _view.EditClicked += OnEdit;
            _view.DeleteClicked += OnDelete;
        }

        public async void LoadData(string search = null) => await LoadDataAsync(search);

        private async Task LoadDataAsync(string search = null)
        {
            _view.IsLoading = true;
            try
            {
                var data = await Task.Run(() => _api.GetPhoneNumberListAsync());
                if (!string.IsNullOrEmpty(search))
                    data = data.FindAll(p =>
                        (p.DisplayName ?? "").IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0 ||
                        (p.DisplayPhone ?? "").IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0);
                _data = data;
                _view.DataSource = data;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Gagal load phone numbers: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                _view.IsLoading = false;
            }
        }

        private void OnAdd(object sender, EventArgs e)
        {
            var result = MessageBox.Show("Sync phone numbers from Meta?", "Add", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (result == DialogResult.Yes)
            {
                _view.IsLoading = true;
                Task.Run(async () =>
                {
                    try
                    {
                        await _api.SyncPhoneNumbersFromMetaAsync();
                        await LoadDataAsync();
                        MessageBox.Show("Sync complete.", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show($"Sync failed: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                    finally
                    {
                        _view.IsLoading = false;
                    }
                });
            }
        }

        private void OnEdit(object sender, EventArgs e)
        {
            if (_view.SelectedIndex < 0) { MessageBox.Show("Pilih baris dulu.", "Info"); return; }
            var item = _data[_view.SelectedIndex];
            var key = $"phonedetail_{item.PhoneNumberId}";
            _bus.Publish(new RequestOpenTabMessage(key, item.DisplayName ?? item.PhoneNumberId));
        }

        private void OnDelete(object sender, EventArgs e)
        {
            if (_view.SelectedIndex < 0) { MessageBox.Show("Pilih baris dulu.", "Info"); return; }
            MessageBox.Show("Delete phone number — implement API call if needed.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _view.RefreshClicked -= null;
                _view.SearchClicked -= null;
                _view.AddClicked -= null;
                _view.EditClicked -= null;
                _view.DeleteClicked -= null;
                _disposed = true;
            }
        }
    }
}
