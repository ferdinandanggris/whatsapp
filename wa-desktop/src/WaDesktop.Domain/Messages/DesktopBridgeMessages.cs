namespace WaDesktop.Domain.Messages
{
    /// <summary>Published when the SPA requests a desktop notification.</summary>
    public class ShowNotificationMessage
    {
        public string Title { get; }
        public string Body { get; }

        public ShowNotificationMessage(string title, string body)
        {
            Title = title;
            Body = body;
        }
    }

    /// <summary>Published when the SPA requests a taskbar badge update.</summary>
    public class SetBadgeMessage
    {
        public int Count { get; }

        public SetBadgeMessage(int count)
        {
            Count = count;
        }
    }
}
