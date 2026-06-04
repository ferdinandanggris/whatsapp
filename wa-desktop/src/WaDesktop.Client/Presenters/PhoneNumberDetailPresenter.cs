using System;
using System.Threading.Tasks;
using WaDesktop.Domain.Interfaces;

namespace WaDesktop.Client.Presenters
{
    public class PhoneNumberDetailPresenter : IDisposable
    {
        private readonly IPhoneNumberDetailView _view;
        private readonly IApiClient _api;
        private readonly string _phoneNumberId;
        private bool _disposed;

        public PhoneNumberDetailPresenter(IPhoneNumberDetailView view, IApiClient api, string phoneNumberId)
        {
            _view = view;
            _api = api;
            _phoneNumberId = phoneNumberId;

            _view.SaveClicked += OnSave;
            _view.FetchFromMetaClicked += OnFetchFromMeta;
            _view.UploadPhotoClicked += OnUploadPhoto;
            _view.RefreshClicked += async (s, e) => await LoadDataAsync();
        }

        public async void LoadData() => await LoadDataAsync();

        private async Task LoadDataAsync()
        {
            _view.IsSaving = true;
            try
            {

                var companies = await Task.Run(() => _api.GetCompaniesAsync());
                _view.LoadCompanies(companies);

                var detail = await Task.Run(() => _api.GetPhoneDetailAsync(_phoneNumberId));
                _view.LoadDetail(detail);

                if (!string.IsNullOrEmpty(detail.ProfilePictureUrl))
                {
                    var pictureData = await Task.Run(() => _api.GetPhoneProfilePictureAsync(detail.ProfilePictureUrl));
                    _view.LoadProfilePicture(pictureData);
                }
            }
            catch (Exception ex)
            {
                _view.ShowError($"Failed to load: {ex.Message}");
            }
            finally
            {
                _view.IsSaving = false;
            }
        }

        private async void OnSave(object sender, EventArgs e)
        {
            _view.IsSaving = true;
            try
            {
                var result = await Task.Run(() =>
                    _api.SavePhoneDetailAsync(
                        _phoneNumberId,
                        _view.DisplayName,
                        _view.Description,
                        _view.SelectedCompanyId,
                        _view.Email,
                        _view.About,
                        _view.Address,
                        _view.Vertical,
                        _view.WebsitesText));
                _view.LoadDetail(result);

                if (!string.IsNullOrEmpty(result.ProfilePictureUrl))
                {
                    var pictureData = await Task.Run(() => _api.GetPhoneProfilePictureAsync(result.ProfilePictureUrl));
                    _view.LoadProfilePicture(pictureData);
                }
                _view.ShowSuccess("Phone number updated.");
            }
            catch (Exception ex)
            {
                _view.ShowError($"Save failed: {ex.Message}");
            }
            finally
            {
                _view.IsSaving = false;
            }
        }

        private async void OnFetchFromMeta(object sender, EventArgs e)
        {
            _view.IsSaving = true;
            try
            {
                var result = await Task.Run(() => _api.SyncPhoneProfileAsync(_phoneNumberId));
                _view.LoadDetail(result);

                if (!string.IsNullOrEmpty(result.ProfilePictureUrl))
                {
                    var pictureData = await Task.Run(() => _api.GetPhoneProfilePictureAsync(result.ProfilePictureUrl));
                    _view.LoadProfilePicture(pictureData);
                }
                _view.ShowSuccess("Profile synced from Meta.");
            }
            catch (Exception ex)
            {
                _view.ShowError($"Sync failed: {ex.Message}");
            }
            finally
            {
                _view.IsSaving = false;
            }
        }

        private async void OnUploadPhoto(object sender, EventArgs e)
        {
            var filePath = _view.PendingUploadPath;
            if (string.IsNullOrEmpty(filePath))
            {
                _view.ShowError("No file selected.");
                return;
            }

            _view.IsSaving = true;
            try
            {
                var result = await Task.Run(() => _api.UploadPhonePictureAsync(_phoneNumberId, filePath));
                _view.LoadDetail(result);

                if (!string.IsNullOrEmpty(result.ProfilePictureUrl))
                {
                    var pictureData = await Task.Run(() => _api.GetPhoneProfilePictureAsync(result.ProfilePictureUrl));
                    _view.LoadProfilePicture(pictureData);
                }
                _view.ShowSuccess("Profile picture updated.");
            }
            catch (Exception ex)
            {
                _view.ShowError($"Upload failed: {ex.Message}");
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
                _view.SaveClicked -= OnSave;
                _view.FetchFromMetaClicked -= OnFetchFromMeta;
                _view.UploadPhotoClicked -= OnUploadPhoto;
                _disposed = true;
            }
        }
    }
}
