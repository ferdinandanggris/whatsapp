using System;
using WaDesktop.Domain.Interfaces;

namespace WaDesktop.Client.Presenters
{
    public class DashboardPresenter : IDisposable
    {
        private readonly IDashboardView _view;
        private readonly IEventAggregator _bus;
        private bool _disposed;

        public DashboardPresenter(IDashboardView view, IEventAggregator bus)
        {
            _view = view;
            _bus = bus;

            // Load frontend SPA
            _view.Url = "http://localhost:5173"; // Vite dev server
        }

        public void Dispose()
        {
            if (!_disposed)
            {
                _disposed = true;
            }
        }
    }
}
