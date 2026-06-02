namespace WaDesktop.Domain.Interfaces
{
    /// <summary>
    /// Base interface for all views. Only exposes InvokeRequired,
    /// which is automatically satisfied by WinForms Control subclasses.
    /// Thread-safe marshaling is handled via ControlExtensions.InvokeIfRequired
    /// extension method in the Client project.
    /// </summary>
    public interface IViewBase
    {
        bool InvokeRequired { get; }
    }
}
