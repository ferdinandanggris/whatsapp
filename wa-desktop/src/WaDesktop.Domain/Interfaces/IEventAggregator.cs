using System;

namespace WaDesktop.Domain.Interfaces
{
    public interface IEventAggregator
    {
        /// <summary>Berlangganan ke tipe pesan. Returns IDisposable untuk unsubscribe.</summary>
        IDisposable Subscribe<TMessage>(Action<TMessage> action);

        /// <summary>Publikasikan pesan ke semua subscriber.</summary>
        void Publish<TMessage>(TMessage message);
    }
}
