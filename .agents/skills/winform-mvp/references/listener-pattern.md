# **Pola Komunikasi: View ke Presenter**

Di dalam arsitektur ini, **View harus benar-benar pasif (Passive View)**. Ia hanya meneruskan *action* dari user (klik tombol, perubahan pilihan) ke Presenter. Ada dua cara yang disahkan untuk melakukan ini, bergantung pada preferensi proyek.

## **1\. Native C\# Events (Dengan Syarat Ketat)**

Cara paling umum di .NET, tetapi berbahaya jika Presenter di-load dinamis dan tidak dihapus dengan benar.

**Aturan Emas:** JIKA menggunakan \+=, Presenter **WAJIB** mengimplementasikan IDisposable dan melakukan \-=.

// 1\. Kontrak  
public interface IContactsView  
{  
    string FirstName { get; set; }  
    event EventHandler SaveClicked;  
}

// 2\. View  
public partial class ContactsView : UserControl, IContactsView  
{  
    public string FirstName { get \=\> txtName.Text; set \=\> txtName.Text \= value; }  
    public event EventHandler SaveClicked;  
      
    private void btnSave\_Click(object sender, EventArgs e)   
        \=\> SaveClicked?.Invoke(this, EventArgs.Empty);  
}

// 3\. Presenter  
public class ContactsPresenter : IDisposable  
{  
    private readonly IContactsView \_view;

    public ContactsPresenter(IContactsView view)  
    {  
        \_view \= view;  
        \_view.SaveClicked \+= OnSaveClicked; // LANGGANAN (Subscribe)  
    }

    private void OnSaveClicked(object sender, EventArgs e) { /\* Logika Simpan \*/ }

    public void Dispose()  
    {  
        \_view.SaveClicked \-= OnSaveClicked; // WAJIB BERHENTI LANGGANAN (Unsubscribe)  
    }  
}

## **2\. Listener Interface (Alternatif Aman, Tanpa Event)**

View memanggil interface Listener secara langsung. Memiliki kelebihan: tidak rentan terhadap memory leak karena *event delegate*.

// 1\. Kontrak  
public interface IModulListener { void OnAddClicked(); }  
public interface IModulView { void SetListener(IModulListener listener); }

// 2\. View  
public partial class ModulView : UserControl, IModulView  
{  
    private IModulListener \_listener;  
    public void SetListener(IModulListener listener) \=\> \_listener \= listener;

    private void btnAdd\_Click(object sender, EventArgs e)  
        \=\> \_listener?.OnAddClicked(); // Panggil langsung  
}

// 3\. Presenter  
public class ModulPresenter : IModulListener  
{  
    private readonly IModulView \_view;  
    public ModulPresenter(IModulView view)  
    {  
        \_view \= view;  
        \_view.SetListener(this);  
    }  
    public void OnAddClicked() { /\* Logika Simpan \*/ }  
}  
