using System;
using System.Collections.Generic;

namespace WaDesktop.Infrastructure
{
    /// <summary>Simple DI container — register once, resolve everywhere.</summary>
    public static class ServiceLocator
    {
        private static readonly Dictionary<Type, object> _instances = new Dictionary<Type, object>();

        public static void Register<TInterface>(TInterface instance)
        {
            _instances[typeof(TInterface)] = instance;
        }

        public static TInterface Resolve<TInterface>()
        {
            return (TInterface)_instances[typeof(TInterface)];
        }

        public static bool IsRegistered<TInterface>()
        {
            return _instances.ContainsKey(typeof(TInterface));
        }
    }
}
