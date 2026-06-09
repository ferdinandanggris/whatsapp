using System;
using System.Threading.Tasks;
using System.Windows.Forms;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Entities;
using WaDesktop.Client.Views.ManagementViews;

namespace WaDesktop.Client.Presenters
{
    public class UsersPresenter : IDisposable
    {
        private readonly UsersView _view;
        private readonly IApiClient _api;
        private bool _disposed;
        private const string DefaultPassword = "WaClientDefault123?";

        public UsersPresenter(UsersView view, IApiClient api)
        {
            _view = view;
            _api = api;

            _view.RefreshClicked += async (s, e) => await LoadDataAsync();
            _view.SearchClicked += async (s, q) => await LoadDataAsync(q);
            _view.SaveClicked += OnSaveClicked;
            _view.ResetPasswordClicked += OnResetPassword;
        }

        public async void LoadData(string search = null) => await LoadDataAsync(search);

        private async Task LoadDataAsync(string search = null)
        {
            _view.IsLoading = true;
            try
            {
                var companies = await Task.Run(() => _api.GetCompaniesAsync());
                _view.SetCompanies(companies);

                var data = await Task.Run(() => _api.GetUsersAsync(search));
                _view.DataSource = data;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Gagal load users: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
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
                foreach (string id in _view.GetDeletedIds())
                    await Task.Run(() => _api.DeactivateUserAsync(id));

                foreach (User u in _view.GetModifiedRows())
                {
                    if (string.IsNullOrEmpty(u.Id))
                        await Task.Run(() => _api.CreateUserAsync(u.Email, DefaultPassword, u.DisplayName, u.Role, u.CompanyId));
                    else
                        await Task.Run(() => _api.UpdateUserAsync(u.Id, u.DisplayName, u.Role, u.CompanyId, u.IsActive));
                }

                await LoadDataAsync();
                MessageBox.Show("Data berhasil disimpan.", "Sukses", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Gagal menyimpan: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                _view.IsLoading = false;
            }
        }

        private async void OnResetPassword(object sender, string userId)
        {
            var confirm = MessageBox.Show("Reset password user ini menjadi " + DefaultPassword + "?",
                "Konfirmasi", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
            if (confirm != DialogResult.Yes) return;

            _view.IsLoading = true;
            try
            {
                await Task.Run(() => _api.ResetPasswordAsync(userId, DefaultPassword));
                MessageBox.Show($"Password berhasil direset menjadi {DefaultPassword}",
                    "Sukses", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Gagal reset password: {ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
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
                _view.ResetPasswordClicked -= null;
                _disposed = true;
            }
        }
    }
}
