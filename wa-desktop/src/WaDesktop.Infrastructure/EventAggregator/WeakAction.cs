using System;

namespace WaDesktop.Infrastructure.EventAggregator
{
    internal class WeakAction<TMessage>
    {
        private readonly WeakReference _target;
        private readonly Action<TMessage> _action;

        public WeakAction(Action<TMessage> action)
        {
            _action = action;
            _target = new WeakReference(action.Target);
        }

        public bool IsAlive => _target.IsAlive;

        public bool Execute(TMessage message)
        {
            if (!_target.IsAlive) return false;
            _action(message);
            return true;
        }

        public void Release()
        {
            _target.Target = null;
        }
    }
}
