# **Aliran Data Searah (Unidirectional Data Flow)**

Dalam aplikasi besar, data sering kali dibagikan di antara beberapa tampilan/Presenter. Jika Presenter saling memutasi data satu sama lain, aplikasi akan mengalami "Spaghetti State". Solusinya adalah *Unidirectional Data Flow*.

## **Konsep Inti**

1. **Presenter HANYA MEMBACA** state global (via Interface) dan menampilkan ke View.  
2. Saat perlu perubahan (misal: Simpan, Koneksi, Hapus), Presenter **TIDAK mengubah** state tersebut.  
3. Presenter memanggil **UseCase**.  
4. **UseCase mengeksekusi logika**, mengubah **State Container (Single Source of Truth)**.  
5. UseCase memicu **Pesan (Event Aggregator)**.  
6. Presenter (dan Presenter lain yang terpengaruh) menerima pesan, membaca ulang *State*, lalu memperbarui UI.

## **Contoh Kode**

// 1\. State Container (Singleton di-inject via DI)  
public interface IModulMemory   
{   
    void UpdateRecord(Terminal terminal);  
    Terminal GetTerminal(string id);  
}

// 2\. UseCase (Di-inject ke Presenter yang memicu aksi)  
public class ConnectTerminalUseCase : IConnectTerminalUseCase  
{  
    private readonly IModulMemory \_state;  
    private readonly IEventAggregator \_bus;

    public ConnectTerminalUseCase(IModulMemory state, IEventAggregator bus)  
    {  
        \_state \= state;  
        \_bus \= bus;  
    }

    public void Execute(Terminal terminal)  
    {  
        // Aksi nyata  
        bool isConnected \= HardwareApi.Connect(terminal);  
        if (isConnected)  
        {  
            terminal.Status \= TerminalStatus.Connected;  
              
            // MUTASI STATE TUNGGAL  
            \_state.UpdateRecord(terminal);  
              
            // SIARKAN PERUBAHAN  
            \_bus.Publish(new TerminalStatusChangedMessage(terminal.Id, terminal.Status));  
        }  
    }  
}  
