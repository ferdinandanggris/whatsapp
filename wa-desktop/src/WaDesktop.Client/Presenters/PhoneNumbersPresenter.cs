using System;
using System.Threading.Tasks;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Domain.Messages;
using System.Collections.Generic;

using WaDesktop.Client.Views.ManagementViews;

namespace WaDesktop.Client.Presenters
{
    public class PhoneNumbersPresenter : IDisposable
    {
        private readonly IManagementView<PhoneNumberDetail> _view;
        private readonly IApiClient _api;
        private readonly IEventAggregator _bus;
        private List<PhoneNumberDetail> _data;
        private bool _disposed;
        private PhoneNumberView _realView;

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

            _realView = _view as PhoneNumberView;
            if (_realView != null)
            {
                _realView.SyncClicked += OnSync;
                _realView.WabaFilterChanged += OnWabaFilterChanged;
            }
        }

        private string _currentWabaFilter = null;

        private bool _isLoadingData = false;

        private async void OnWabaFilterChanged(object sender, string wabaId)
        {
            _currentWabaFilter = wabaId;
            
            // Jangan load ulang jika kita sedang dalam proses initial load
            if (!_isLoadingData && _wabasLoaded)
            {
                await LoadDataAsync();
            }
        }

        public async void LoadData(string search = null) => await LoadDataAsync(search);

        private bool _wabasLoaded = false;

        private async Task LoadDataAsync(string search = null)
        {
            if (_isLoadingData) return;
            
            _isLoadingData = true;
            _view.IsLoading = true;
            try
            {
                // 1. Load WABA terlebih dahulu jika belum pernah diload
                if (!_wabasLoaded && _realView != null)
                {
                    var wabas = await Task.Run(() => _api.GetWabasAsync());
                    _realView.SetWabaSyncDataSource(wabas);
                    _wabasLoaded = true;

                    // Fallback: pastikan _currentWabaFilter terisi WabaId pertama
                    if (string.IsNullOrEmpty(_currentWabaFilter) && wabas != null && wabas.Count > 0)
                    {
                        _currentWabaFilter = wabas[0].WabaId;
                    }
                }

                // 2. Jika tidak ada WABA sama sekali, kosongkan grid
                if (string.IsNullOrEmpty(_currentWabaFilter))
                {
                    _data = new List<PhoneNumberDetail>();
                    _view.DataSource = _data;
                    return;
                }

                // 3. Setelah WABA terjamin ada, baru panggil API list
                var data = await Task.Run(() => _api.GetPhoneNumberListAsync(_currentWabaFilter));

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
                _isLoadingData = false;
            }
        }

        private void OnAdd(object sender, EventArgs e)
        {
            MessageBox.Show("Tambah Nomor Telepon — implement form dialog jika diperlukan.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void OnSync(object sender, EventArgs e)
        {
            var wabaId = _realView?.SelectedWabaForSyncId;
            if (string.IsNullOrEmpty(wabaId))
            {
                MessageBox.Show("Silakan pilih WABA terlebih dahulu untuk disinkronisasi.", "Peringatan", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var result = MessageBox.Show("Yakin ingin sinkronisasi nomor telepon dari Meta?", "Sinkronisasi", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (result == DialogResult.Yes)
            {
                _view.IsLoading = true;
                Task.Run(async () =>
                {
                    try
                    {
                        await _api.SyncPhoneNumbersFromMetaAsync(wabaId);
                        await LoadDataAsync();
                        MessageBox.Show("Sinkronisasi selesai.", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show($"Sinkronisasi gagal: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
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

                if (_realView != null)
                {
                    _realView.SyncClicked -= OnSync;
                    _realView.WabaFilterChanged -= OnWabaFilterChanged;
                }

                _disposed = true;
            }
        }
    }
}
