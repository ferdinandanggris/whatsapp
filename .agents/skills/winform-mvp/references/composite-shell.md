# **Pola Composite Shell**

Pola **Composite Shell** membagi MainForm menjadi area independen (Regions) yang masing-masing dikelola oleh UserControl dan Presenternya sendiri.

## **Struktur Area (Regions)**

1. **Header (IHeaderView)**: Menu dan informasi aplikasi (Top).  
2. **Sidebar (ISidebarView)**: Navigasi utama yang memicu pesan global untuk membuka modul (Left).  
3. **Workspace (IMainPageView)**: Area kerja dinamis berbasis TabControl tempat modul di-load (Fill).  
4. **Footer (IFooterView)**: Status dan waktu sistem (Bottom).

## **Interaksi Navigasi (Event Aggregator)**

**Pengirim (Sidebar):**

public class SidebarPresenter : IDisposable  
{  
    private readonly ISidebarView \_view;  
    private readonly IEventAggregator \_bus;  
      
    public SidebarPresenter(ISidebarView view, IEventAggregator bus)  
    {  
        \_view \= view; \_bus \= bus;  
        \_view.NodeClicked \+= OnNodeClicked;  
    }

    private void OnNodeClicked(object sender, ModuleEventArgs e)   
        \=\> \_bus.Publish(new RequestOpenTabMessage(e.ModuleType));  
      
    public void Dispose() \=\> \_view.NodeClicked \-= OnNodeClicked;  
}

**Penerima (MainPage):**

public class MainPagePresenter : IDisposable  
{  
    private readonly IMainPageView \_view;  
    private readonly IModuleFactory \_factory;  
    private readonly IDisposable \_sub;

    public MainPagePresenter(IMainPageView view, IEventAggregator bus, IModuleFactory factory)  
    {  
        \_view \= view; \_factory \= factory;  
        \_sub \= bus.Subscribe\<RequestOpenTabMessage\>(msg \=\>   
            \_view.InvokeIfRequired(() \=\>   
                \_view.AddOrSelectTab(msg.ModuleType.ToString(), \_factory.CreateModuleView(msg.ModuleType))));  
    }

    public void Dispose() \=\> \_sub?.Dispose();  
}  
