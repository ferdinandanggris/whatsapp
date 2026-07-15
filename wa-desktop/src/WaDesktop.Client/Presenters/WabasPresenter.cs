using System;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Client.Views.ManagementViews;

namespace WaDesktop.Client.Presenters
{
    public class WabasPresenter : IDisposable
    {
        private readonly WabaView _view;
        private readonly IApiClient _api;
        private bool _disposed;

        public WabasPresenter(WabaView view, IApiClient api)
        {
            _view = view;
            _api = api;

            _view.RefreshClicked += async (s, e) => await LoadDataAsync();
            _view.SearchClicked += async (s, q) => await LoadDataAsync(q);
            _view.AddClicked += OnAdd;
            _view.EditClicked += OnEdit;
            _view.DeleteClicked += OnDelete;
            _view.SaveClicked += OnSave;
            _view.SyncClicked += OnSync;
        }

        public async void LoadData(string search = null) => await LoadDataAsync(search);

        private async Task LoadDataAsync(string search = null)
        {
            _view.IsLoading = true;
            try
            {
                var companiesTask = Task.Run(() => _api.GetCompaniesAsync());
                var wabas = await Task.Run(() => _api.GetWabasAsync());

                var companies = await companiesTask;
                _view.SetCompanyDataSource(companies);

                var companyMap = companies.ToDictionary(c => c.Id, c => c.Name);
                foreach (var w in wabas)
                {
                    if (!string.IsNullOrEmpty(w.CompanyId) && companyMap.TryGetValue(w.CompanyId, out var name))
                        w.CompanyName = name;
                }

                if (!string.IsNullOrEmpty(search))
                    wabas = wabas.FindAll(w =>
                        (w.Name ?? "").IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0 ||
                        (w.WabaId ?? "").IndexOf(search, StringComparison.OrdinalIgnoreCase) >= 0);

                _view.DataSource = wabas;
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

        private async void OnSave(object sender, EventArgs e)
        {
            var wabaId = _view.SelectedWabaId;
            if (wabaId == null)
            {
                MessageBox.Show("Pilih baris dulu.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            _view.IsLoading = true;
            try
            {
                var companyId = _view.SelectedCompanyId;
                await Task.Run(() => _api.UpdateWabaAsync(wabaId, companyId ?? ""));
                await LoadDataAsync();
                MessageBox.Show("Company updated.", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Save failed: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                _view.IsLoading = false;
            }
        }

        private void OnAdd(object sender, EventArgs e)
        {
            MessageBox.Show("Tambah WABA — implement form dialog.", "Info", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void OnSync(object sender, EventArgs e)
        {
            var result = MessageBox.Show("Sinkronisasi WABA dari Meta?", "Sinkronisasi", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (result == DialogResult.Yes)
            {
                _view.IsLoading = true;
                Task.Run(async () =>
                {
                    try
                    {
                        await _api.SyncWabasFromMetaAsync();
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
                _view.SaveClicked -= null;
                _view.SyncClicked -= null;
                _disposed = true;
            }
        }
    }
}