## **name: winforms-enterprise-mvp-architect**

description: Mengimplementasikan arsitektur Model-View-Presenter (MVP) tingkat enterprise pada Windows Forms (.NET 4.7.2). Menggabungkan MVP tradisional dengan pola modern seperti Composite Shell, Unidirectional Data Flow, dan Event Aggregator.

license: MIT

metadata:

author: AI Architect

version: "2.2.0"

domain: desktop-architecture

triggers: WinForms, MVP, Model-View-Presenter, Passive View, .NET 4.7.2, Event Aggregator, Message Bus, WeakReference, Memory Leak, Thread-Safe, IDisposable, Service Locator, Composite Shell

role: architect

scope: implementation

output-format: code

related-skills: csharp-pro, solid-principles, clean-architecture

# **Arsitektur WinForms Enterprise MVP (.NET Framework 4.7.2)**

Panduan ini mendefinisikan standar emas dalam membangun atau merefaktor aplikasi Windows Forms berskala besar (*enterprise*) menggunakan .NET Framework 4.7.2.

Pengembangan WinForms tradisional sering kali berujung pada pola anti-pattern "Smart UI" (atau *God Objects*), di mana akses database, logika bisnis, dan pembaruan antarmuka bercampur aduk di dalam file *code-behind* (seperti Form1.cs). Hal ini menyebabkan aplikasi sulit diuji (*untestable*), rawan kebocoran memori, dan sulit dipelihara oleh tim besar. Panduan ini menggabungkan prinsip dasar **Model-View-Presenter (MVP)** ragam *Passive View* dengan pola arsitektur *enterprise* (Composite Shell, Event Aggregator) untuk memastikan aplikasi desktop yang *scalable*, *thread-safe*, modular, dan dapat diuji secara terisolasi.

## **Alur Kerja Inti (Core Workflow)**

1. **Analisis Kebutuhan UI & Pemetaan State** Sebelum menulis kode, identifikasi hierarki tampilan menggunakan pola Composite Shell (Header, Sidebar, Workspace/TabPages, Footer). Tentukan mana komponen yang statis (berumur panjang seperti Header) dan mana yang dinamis (berumur pendek seperti Tab di Workspace). Bedakan secara tegas antara *UI State* (contoh: status tombol *disabled/enabled*, warna elemen) dengan *Domain State* (data pengguna, status koneksi perangkat keras).  
2. **Desain Kontrak (Interfaces) yang Ketat** Definisikan IView, IListener, dan IUseCase untuk memastikan pemisahan (decoupling) yang ketat.  
   * **Aturan Emas Kontrak:** Jangan pernah membocorkan tipe spesifik WinForms (seperti DataGridView, TextBox, atau TreeNode) ke dalam *interface* IView. Gunakan tipe data primitif, *Collections* (IList, IEnumerable), atau *Data Transfer Objects* (DTO).  
3. **Implementasi Tampilan Pasif (Passive Views)** Kelas Form atau UserControl Anda **murni** hanya bertindak sebagai *dumb rendering engine* (mesin perender bodoh). File *code-behind* hanya boleh berisi properti yang melakukan *get/set* ke elemen UI dan *event handler* yang mendelegasikan aksi pengguna ke Presenter. Jika ada logika bersyarat (if/switch) di *code-behind*, maka desain tersebut salah.  
4. **Komunikasi UI yang Aman & Siklus Hidup (Lifecycle)** Gunakan C\# Events (dengan kewajiban mutlak memanggil \-= di IDisposable) atau Pola Listener (IListener) untuk komunikasi antara View dan Presenter lokal. Pahami siklus hidup View: ketika View dihancurkan (misal: Tab ditutup), Presenternya harus ikut dihancurkan dan melepaskan semua ikatannya untuk membiarkan *Garbage Collector* bekerja.  
5. **Manajemen State Global (Unidirectional Data Flow)** Dalam aplikasi besar, data sering dibagikan antar modul (contoh: profil user aktif, status hardware). Hindari "Spaghetti State" di mana Presenter saling memodifikasi data satu sama lain. Gunakan *Unidirectional Data Flow*: Presenter HANYA membaca, Presenter memicu UseCase, UseCase memvalidasi dan mengubah StateContainer global, lalu UseCase menyiarkan pesan (lewat *Message Bus*) bahwa state telah berubah.  
6. **Thread Safety & Isolasi Memori** Antarmuka pengguna WinForms mematuhi model *Single-Threaded Apartment (STA)*. Eksekusi tugas berat di *background thread* adalah wajib (melalui Task.Run), namun pembaruan ke elemen UI **harus selalu** diarahkan kembali ke UI thread menggunakan ISynchronizeInvoke (Control.InvokeRequired). Selain itu, cegah "zombie subscribers" di Message Bus dengan menggunakan implementasi WeakReference.

## **Struktur Proyek yang Direkomendasikan**

Untuk mendukung pemisahan tanggung jawab (Separation of Concerns), proyeksikan solusi Anda seperti berikut:

Solution  
├── 1\. Domain (Logika Inti, Interfaces, UseCases, Entities) \-\> DILARANG ada referensi UI/WinForms  
├── 2\. DataAccess (Implementasi Repository, EF/Dapper, API Client)  
├── 3\. Infrastructure (DI Container, Service Locator, EventAggregator, Logging)  
├── 4\. Client (Proyek WinForms .NET 4.7.2)  
│   ├── Controls (Custom/Re-usable UserControls)  
│   ├── Views (Form dan UserControl spesifik fitur)  
│   └── Presenters (Logika Presentasi, mengimplementasikan IDisposable)  
└── 5\. Tests (NUnit/xUnit \- Unit Tests untuk Domain dan Presenters)

## **Panduan Referensi Lengkap**

Detail implementasi teknis spesifik telah dipecah ke dalam modul-modul referensi mandiri. Gunakan tabel ini untuk memuat referensi yang tepat sesuai konteks pengembangan yang sedang Anda hadapi:

| **Topik Utama** | **File Referensi** | **Konteks Penggunaan & Muat Ketika** |

| **Composite Shell** | references/composite-shell.md | Mengatur tata letak aplikasi utama. Membangun ruang kerja multi-panel yang dinamis (Header statis, Sidebar navigasi, TabPages untuk Workspace, Footer). |

| **Listener & Events** | references/listener-pattern.md | Membangun jembatan komunikasi antara View dan Presenter, beserta aturan baku dan peringatan tentang penggunaan event native C\# (+=). |

| **Unidirectional Flow** | references/unidirectional-flow.md | Mencegah *race condition* atau ketidakkonsistenan antarmuka. Digunakan saat menangani mutasi data global yang perlu direfleksikan di berbagai Tab/Presenter sekaligus. |

| **Message Bus** | references/message-bus.md | Membangun arsitektur Pub/Sub (Event Aggregation) global yang terdekripsi penuh untuk menyiarkan status aplikasi. |

| **Memory Management** | references/memory-management.md | Panduan kritis mencegah kebocoran memori (Gen 2 Leaks) dengan menggunakan pola IDisposable pada Presenter yang berumur pendek. |

| **Thread Safety** | references/thread-safety.md | Strategi menghindari dan menangani *Cross-Thread Operation exceptions* di WinForms yang sering terjadi saat bekerja dengan asinkronisitas. |

| **Unit Testing** | references/unit-testing.md | Strategi membuat *Hand-rolled fakes/stubs* untuk Views dan menulis pengujian NUnit/xUnit demi cakupan (coverage) yang maksimal. |

## **Batasan (Constraints) Utama**

Ini adalah aturan tidak tertulis (namun wajib dipatuhi) yang membedakan kode *legacy* yang buruk dengan arsitektur *enterprise* yang bersih:

* **HARUS (MUST DO):**  
  * Selalu bungkus logika *cross-thread* dengan ekstensi InvokeIfRequired. Jika aplikasi *crash* karena masalah thread, arsitektur Anda gagal di tahap dasar.  
  * Mengimplementasikan IDisposable pada Presenter yang berlangganan ke event View (+=) atau MessageBus global.  
  * Gunakan DTO (Data Transfer Objects) untuk mengikat koleksi data ke kontrol seperti DataGridView, bukan dengan mem-binding langsung entitas database.  
  * Meletakkan layanan *Dialog* (seperti IDialogService) di layer Infrastructure.  
* **TIDAK BOLEH (MUST NOT DO):**  
  * **DILARANG** menempatkan logika bisnis, operasi matematika kompleks, validasi form mendalam, panggilan database, atau mutasi *state* apa pun di dalam file *Code-Behind* UI.  
  * **DILARANG** mengubah state global secara langsung dari sebuah Presenter. Hal ini mengaburkan jejak data. Selalu delegasikan ke IUseCase.  
  * **DILARANG** memanggil MessageBox.Show() atau new Form().ShowDialog() secara langsung di dalam kelas Presenter. Ini akan memblokir eksekusi saat Anda menjalankan *automated Unit Tests* di server CI/CD. Gunakan abstraksi (misal: \_view.ShowError(msg) atau \_dialogService.Confirm(msg)).

  * # **DILARANG membuat dependensi siklik (Circular Dependencies) di mana View memanggil Presenter, dan Presenter memanggil tipe View konkret (bukan *interface*).**

## **Format Output (Output Templates)**

Setiap kali Anda diminta untuk mengimplementasikan atau merefaktor fitur WinForms ke pola MVP berdasarkan standar ini, hasilkan struktur dokumen/kode berikut secara konsisten:

1. IXxxView.cs — Kontrak UI (*Interface*). Mendefinisikan properti (*get/set*), event aksi, dan metode helper visual murni.  
2. XxxView.cs (atau .Designer.cs logic) — File *Code-Behind* murni tanpa logika bisnis, mengimplementasikan IXxxView, berisi pemicu (*triggers*) untuk mendelegasikan aksi pengguna ke event/listener.  
3. XxxPresenter.cs — Otak dari UI. Mengatur aliran data, menyuntikkan dependensi (*constructor injection*), mengelola status tampilan, merespons event dari View, dan WAJIB mengimplementasikan IDisposable untuk pembersihan (*cleanup*).  
4. XxxUseCase.cs — (Disediakan jika skenario melibatkan modifikasi data global, transaksi, atau operasi database).  
5. *Unit Test File* (XxxPresenterTests.cs) — Uji NUnit atau xUnit menggunakan FakeXxxView.cs (*stub* manual tanpa Moq untuk UI) untuk memverifikasi logika tampilan secara terisolasi dan instan.