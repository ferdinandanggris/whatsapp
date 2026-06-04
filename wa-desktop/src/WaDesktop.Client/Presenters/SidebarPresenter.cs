using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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

        private static IList<PhoneNumberNode> BuildTree(List<PhoneNumberNode> phones)
        {
            var root = new PhoneNumberNode { DisplayName = "Phone Numbers", CompanyName = null };

            // Group: null company_id → "No Company" first, then rest sorted by name
            var noCompany = phones.Where(p => p.CompanyId == null).ToList();
            var withCompany = phones.Where(p => p.CompanyId != null)
                .GroupBy(p => new { p.CompanyId, p.CompanyName })
                .OrderBy(g => g.Key.CompanyName).ToList();

            if (noCompany.Count > 0)
            {
                var ncNode = new PhoneNumberNode { DisplayName = "No Company", CompanyName = "No Company" };
                foreach (var p in noCompany.OrderBy(p => p.DisplayName))
                    ncNode.Children.Add(p);
                root.Children.Add(ncNode);
            }

            foreach (var group in withCompany)
            {
                var coNode = new PhoneNumberNode { DisplayName = group.Key.CompanyName, CompanyId = group.Key.CompanyId, CompanyName = group.Key.CompanyName };
                foreach (var p in group.OrderBy(p => p.DisplayName))
                    coNode.Children.Add(p);
                root.Children.Add(coNode);
            }

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
                _disposed = true;
            }
        }
    }
}
