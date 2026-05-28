# **Event Aggregation (Message Bus)**

Event Aggregator adalah pola Pub/Sub yang digunakan untuk berkomunikasi antar komponen yang tidak saling terkait tanpa menimbulkan ketergantungan (coupling) secara langsung.

## **Mengapa WeakReference?**

Di WinForms standar, jika Presenter A berlangganan ke Singleton Event Bus menggunakan tipe referensi kuat (Strong Reference), maka Presenter A **TIDAK AKAN PERNAH DIHAPUS OLEH GARBAGE COLLECTOR**, bahkan jika UI-nya (Tab) ditutup. Oleh karena itu, kita harus mengimplementasikan Event Aggregator berbasis WeakReference.

## **Contoh Kontrak Interface**

public interface IEventAggregator  
{  
    // Mengembalikan IDisposable agar pelanggan bisa unsubscribe manual secara eksplisit  
    IDisposable Subscribe\<TMessage\>(Action\<TMessage\> action);  
      
    // Publikasikan pesan  
    void Publish\<TMessage\>(TMessage message);  
}

## **Immutable Messages**

Pesan yang dikirimkan ke dalam *bus* harus *Immutable* (tidak bisa diubah nilainya). Hal ini mencegah Presenter penerima tanpa sengaja merusak data yang sedang dibaca oleh Presenter lain.

// Pesan yang dikirim hanya bersifat "read-only" (immutable)  
public class TerminalStatusChangedMessage  
{  
    public string TerminalId { get; }  
    public ConnectionStatus NewStatus { get; }

    public TerminalStatusChangedMessage(string terminalId, ConnectionStatus status)  
    {  
        TerminalId \= terminalId;  
        NewStatus \= status;  
    }  
}  
