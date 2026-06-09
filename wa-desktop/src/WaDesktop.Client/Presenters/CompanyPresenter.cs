using System;
using System.Threading.Tasks;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Client.Views.ManagementViews;

namespace WaDesktop.Client.Presenters
{
    public class CompanyPresenter : IDisposable
    {
        private readonly CompanyView _view;
        private readonly IApiClient _api;
        private bool _disposed;

        public CompanyPresenter(CompanyView view, IApiClient api)
        {
            _view = view;
            _api = api;

            _view.RefreshClicked += async (s, e) => await LoadDataAsync();
            _view.SearchClicked += async (s, q) => await LoadDataAsync(q);
            _view.SaveClicked += OnSaveClicked;
        }

        public async void LoadData(string search = null) => await LoadDataAsync(search);

        private async Task LoadDataAsync(string search = null)
        {
            _view.IsLoading = true;
            try
            {
                var data = await Task.Run(() => _api.GetCompaniesAsync(search));
                _view.DataSource = data;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal load companies: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                _view.IsLoading = false;
            }
        }

        private async void OnSaveClicked(object sender, EventArgs e)
        {
            _view.IsLoading = true;
            try
            {
                // Delete rows that user removed via Delete key
                foreach (long id in _view.GetDeletedIds())
                    await Task.Run(() => _api.DeleteCompanyAsync(id));

                // Create new / update existing
                foreach (Company c in _view.GetModifiedRows())
                {
                    if (c.Id == 0)
                        await Task.Run(() => _api.CreateCompanyAsync(c.Name));
                    else
                        await Task.Run(() => _api.UpdateCompanyAsync(c.Id, c.Name));
                }

                await LoadDataAsync();
                MessageBox.Show("Data berhasil disimpan.", "Sukses", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Gagal menyimpan: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                _view.IsLoading = false;
            }
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _view.RefreshClicked -= null;
                _view.SearchClicked -= null;
                _view.SaveClicked -= null;
                _disposed = true;
            }
        }
    }
}
