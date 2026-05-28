# **Manajemen Memori (Mencegah Kebocoran Memori)**

Masalah paling mematikan dalam pengembangan WinForms dinamis (seperti membuka/menutup TabPages berulang kali) adalah **Gen 2 Memory Leaks**. Hal ini biasanya disebabkan oleh referensi *event handler* yang tertinggal (*dangling event subscriptions*).

## **Mekanisme Terjadinya Leak**

Jika View (misalnya UserControl) dihancurkan (di-*Dispose* oleh WinForms), namun Presenternya masih terikat ke *Singleton Data Service* atau *MainForm* melalui event \+=, maka Garbage Collector tidak akan membebaskan memori View tersebut karena Presenter (dan event-nya) masih memiliki *strong reference* ke View tersebut.

## **Aturan IDisposable**

Setiap Presenter yang melampirkan event handler harus mengimplementasikan antarmuka IDisposable.

public class PengaturanPresenter : IDisposable  
{  
    private readonly IPengaturanView \_view;  
    private readonly IDataService \_dataService; // Singleton global

    public PengaturanPresenter(IPengaturanView view, IDataService dataService)  
    {  
        \_view \= view;  
        \_dataService \= dataService;

        // Berlangganan (Menciptakan ikatan / strong coupling)  
        \_view.SimpanClicked \+= OnSimpanClicked;  
        \_dataService.DataTelahBerubah \+= OnGlobalDataChanged;  
    }

    // Dipanggil saat Tab/Form ditutup  
    public void Dispose()  
    {  
        // HANCURKAN IKATAN  
        \_view.SimpanClicked \-= OnSimpanClicked;  
        \_dataService.DataTelahBerubah \-= OnGlobalDataChanged;  
    }  
}

**Penting:** Selalu pastikan mekanisme *router* UI Anda (seperti Workspace Tab Manager) memanggil method .Dispose() pada Presenter ketika Tab ditutup oleh pengguna.