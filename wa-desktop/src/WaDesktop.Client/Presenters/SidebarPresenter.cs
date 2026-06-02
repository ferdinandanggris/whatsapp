using System;
using System.Threading.Tasks;
using WaDesktop.Domain.Interfaces;
using WaDesktop.Domain.Messages;
using WaDesktop.Infrastructure;

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
        }

        public async Task LoadDataAsync()
        {
            _view.IsLoading = true;
            try
            {
                var nodes = await Task.Run(() => _api.GetPhoneNumbersAsync());
                _view.LoadPhoneNumbers(nodes);
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

        private void OnPhoneNumberSelected(object sender, PhoneNumberSelectedEventArgs e)
        {
            var key = $"phonenumber_{e.PhoneNumberId}_{e.WaId}";
            _bus.Publish(new RequestOpenTabMessage(key, e.DisplayName ?? e.WaId));
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _view.PhoneNumberSelected -= OnPhoneNumberSelected;
                _disposed = true;
            }
        }
    }
}
