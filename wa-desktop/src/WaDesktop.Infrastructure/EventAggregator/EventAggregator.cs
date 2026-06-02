using System;
using System.Collections.Generic;
using WaDesktop.Domain.Interfaces;

namespace WaDesktop.Infrastructure.EventAggregator
{
    public class EventAggregator : IEventAggregator
    {
        private readonly object _lock = new object();
        private readonly Dictionary<Type, List<object>> _subscribers = new Dictionary<Type, List<object>>();

        public IDisposable Subscribe<TMessage>(Action<TMessage> action)
        {
            var weakAction = new WeakAction<TMessage>(action);
            lock (_lock)
            {
                var type = typeof(TMessage);
                if (!_subscribers.TryGetValue(type, out var list))
                {
                    list = new List<object>();
                    _subscribers[type] = list;
                }
                list.Add(weakAction);
            }
            return new Unsubscriber<TMessage>(this, weakAction);
        }

        public void Publish<TMessage>(TMessage message)
        {
            List<object> snapshot;
            lock (_lock)
            {
                var type = typeof(TMessage);
                if (!_subscribers.TryGetValue(type, out var list))
                    return;
                snapshot = new List<object>(list);
            }

            foreach (var obj in snapshot)
            {
                if (obj is WeakAction<TMessage> weak && weak.IsAlive)
                {
                    weak.Execute(message);
                }
                else if (obj is WeakAction<TMessage> dead)
                {
                    // Cleanup zombie subscribers
                    UnsubscribeInternal(typeof(TMessage), dead);
                }
            }
        }

        internal void UnsubscribeInternal(Type type, object weakAction)
        {
            lock (_lock)
            {
                if (_subscribers.TryGetValue(type, out var list))
                {
                    list.Remove(weakAction);
                    if (list.Count == 0)
                        _subscribers.Remove(type);
                }
            }
        }

        private class Unsubscriber<T> : IDisposable
        {
            private readonly EventAggregator _ea;
            private readonly WeakAction<T> _weak;
            public Unsubscriber(EventAggregator ea, WeakAction<T> weak) { _ea = ea; _weak = weak; }
            public void Dispose()
            {
                _weak.Release();
                _ea.UnsubscribeInternal(typeof(T), _weak);
            }
        }
    }
}
