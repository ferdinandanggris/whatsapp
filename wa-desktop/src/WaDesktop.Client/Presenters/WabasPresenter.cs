using System;
using System.Threading.Tasks;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;

namespace WaDesktop.Client.Presenters
{
    public class WabasPresenter : IDisposable
    {
        private readonly IManagementView<Waba> _view;
        private readonly IApiClient _api;
        private bool _disposed;

        public WabasPresenter(IManagementView<Waba> view, IApiClient api)
        {
            _view = view;
            _api = api;

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
                var data = await Task.Run(() => _api.GetWabasAsync());
                if (!string.IsNullOrEmpty(search))
                    data = data.FindAll(w =>
                        (w.Name ?? "").IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0 ||
                        (w.WabaId ?? "").IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0);
                _view.DataSource = data;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Gagal load WABA: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                _view.IsLoading = false;
            }
        }

        private void OnAdd(object sender, EventArgs e)
        {
            var result = MessageBox.Show("Sync WABA from Meta?", "Add", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (result == DialogResult.Yes)
            {
                _view.IsLoading = true;
                Task.Run(async () =>
                {
                    try
                    {
                        await _api.SyncWabasFromMetaAsync();
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
            MessageBox.Show("Edit WABA — implement form dialog.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void OnDelete(object sender, EventArgs e)
        {
            if (_view.SelectedIndex < 0) { MessageBox.Show("Pilih baris dulu.", "Info"); return; }
            MessageBox.Show("Delete WABA — implement API call if needed.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
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
