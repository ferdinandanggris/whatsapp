using System;

namespace WaDesktop.Domain.Messages
{
    /// <summary>Immutable message untuk membuka tab di workspace.</summary>
    public class RequestOpenTabMessage
    {
        public string ModuleKey { get; }
        public string Title { get; }
        public RequestOpenTabMessage(string moduleKey, string title)
        {
            ModuleKey = moduleKey;
            Title = title;
        }
    }

    /// <summary>Immutable message untuk menutup tab.</summary>
    public class CloseTabMessage
    {
        public string ModuleKey { get; }
        public CloseTabMessage(string moduleKey) => ModuleKey = moduleKey;
    }

    /// <summary>Immutable message: login berhasil.</summary>
    public class LoginCompletedMessage
    {
        public string DisplayName { get; }
        public string Role { get; }
        public LoginCompletedMessage(string displayName, string role)
        {
            DisplayName = displayName;
            Role = role;
        }
    }

    /// <summary>Immutable message: logout.</summary>
    public class LogoutMessage { }
}
