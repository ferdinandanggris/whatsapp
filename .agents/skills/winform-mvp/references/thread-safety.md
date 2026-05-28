# **Thread Safety (Menghindari Cross-Thread Operations)**

Dalam WinForms, kontrol UI HANYA BOLEH diperbarui dari *Thread Utama* (UI Thread). Jika *UseCase*, *BackgroundWorker*, Task.Run, atau *Event Aggregator* mencoba mengubah properti View dari *Thread Latar Belakang* (Background Thread), aplikasi akan mogok (*crash*) dengan error Cross-thread operation not valid.

## **Solusi: Kontrak InvokeIfRequired**

Setiap IView harus mewarisi kontrak dasar yang memaksa sinkronisasi *thread*.

public interface IViewBase  
{  
    // ISynchronizeInvoke disediakan secara native oleh Control WinForms  
    bool InvokeRequired { get; }  
    void InvokeIfRequired(Action action);  
}

## **Implementasi di Base UserControl / Form**

Buat *base class* (kelas dasar) atau ekstensi (extension method) agar Anda tidak perlu mengulanginya di setiap Form.

public static class ControlExtensions  
{  
    public static void InvokeIfRequired(this ISynchronizeInvoke control, Action action)  
    {  
        if (control.InvokeRequired)  
        {  
            control.Invoke(action, new object\[0\]);  
        }  
        else  
        {  
            action();  
        }  
    }  
}

## **Penggunaan di Presenter**

Kapan pun Presenter menerima pemberitahuan dari Bus/Event Aggregator yang dijalankan secara asinkron, gunakan perintah ini:

private void OnDataReceivedFromHardware(HardwareDataMessage msg)  
{  
    // Berpindah ke UI Thread sebelum memodifikasi View  
    \_view.InvokeIfRequired(() \=\>   
    {  
        \_view.StatusMessage \= $"Data dari {msg.DeviceName}: {msg.Value}";  
        \_view.EnableSaveButton \= true;  
    });  
}  
