# **Unit Testing & Hand-Rolled Fakes**

Keuntungan terbesar dari arsitektur MVP adalah kemampuan untuk menguji 100% logika UI tanpa benar-benar membuat instance dari kelas-kelas WinForms (System.Windows.Forms).

## **Membuat Stub / Fake View**

Daripada menggunakan framework *Mocking* (seperti Moq) yang terkadang rumit untuk diatur propertinya berulang kali, kita bisa membuat *class Fake* sederhana.

public class FakeContactsView : IContactsView  
{  
    // Properties  
    public string FirstName { get; set; } \= "";  
    public string StatusMessage { get; set; } \= "";

    // Events  
    public event EventHandler SaveClicked \= delegate { }; // Hindari null reference  
      
    // Test helpers (Memicu simulasi dari sisi UI)  
    public void RaiseSaveClicked() \=\> SaveClicked(this, EventArgs.Empty);

    // Abaikan masalah multithreading saat unit test (jalankan langsung)  
    public void InvokeIfRequired(Action action) \=\> action();   
}

## **Menulis NUnit Test**

Kita dapat menguji apakah Presenter memberikan reaksi yang tepat tanpa membuka form.

\[TestFixture\]  
public class ContactsPresenterTests  
{  
    private FakeContactsView \_view;  
    private Mock\<ISaveContactUseCase\> \_useCaseMock;  
    private ContactsPresenter \_presenter;

    \[SetUp\]  
    public void SetUp()  
    {  
        \_view \= new FakeContactsView();  
        \_useCaseMock \= new Mock\<ISaveContactUseCase\>(); // Menggunakan lib Moq untuk UseCase  
        \_presenter \= new ContactsPresenter(\_view, \_useCaseMock.Object);  
    }

    \[Test\]  
    public void KetikaSaveDiklik\_UseCaseDieksekusiDenganDataView()  
    {  
        // 1\. Arrange  
        \_view.FirstName \= "Budi";

        // 2\. Act (Simulasikan pengguna mengklik tombol)  
        \_view.RaiseSaveClicked();

        // 3\. Assert (Pastikan UseCase dipanggil dengan parameter 'Budi')  
        \_useCaseMock.Verify(u \=\> u.Execute(It.Is\<ContactDto\>(c \=\> c.FirstName \== "Budi")), Times.Once);  
    }  
      
    \[TearDown\]  
    public void TearDown()  
    {  
        \_presenter.Dispose(); // Uji apakah memori dilepaskan  
    }  
}  
