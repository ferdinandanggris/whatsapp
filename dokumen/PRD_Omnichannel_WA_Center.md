# Product Requirements Document (PRD): Omnichannel WA Center (Multi-Tenant)

## 1. Executive Summary

* **Problem Statement**: Pengelolaan *customer service* untuk 12 perusahaan dengan total ~40 aplikasi distribusi pulsa saat ini terfragmentasi, menyebabkan inefisiensi operasional dan lambatnya penanganan keluhan pelanggan.
* **Proposed Solution**: Membangun aplikasi Omnichannel WA Center tersentralisasi secara *multi-tenant* dalam satu WhatsApp Business Account (WABA). Sistem akan me-routing pesan spesifik per aplikasi ke agen yang tepat menggunakan *backend* berkinerja tinggi (Golang) dan antarmuka desktop (*WinForms + React WebView*).
* **Success Criteria**:
    * Mengurangi waktu respons (SLA) Customer Service sebesar **50%** dari *baseline* saat ini.
    * Sistem mampu memproses dan mengantrekan hingga **1.000 pesan per detik (TPS)** secara global tanpa memicu blokir atau penalti dari Meta.
    * **0% kebocoran data** antar entitas perusahaan/aplikasi (isolasi data terjamin).

## 2. User Experience & Functionality

* **User Personas**:
    * **Agen CS**: Operator yang membalas pesan pelanggan menggunakan aplikasi Desktop (WinForms + WebView).
    * **Admin Perusahaan**: Supervisor yang memantau performa agen di perusahaannya.
    * **Super Admin**: Teknisi pusat yang mendaftarkan nomor telepon baru dan memantau antrean *webhook* di *backend*.

* **User Stories & Acceptance Criteria**:
    * **Story**: *Sebagai Agen CS, saya ingin membalas pesan masuk melalui aplikasi desktop yang ringan agar saya bisa bekerja dengan efisien.*
        * **AC 1**: Antarmuka agen dirender menggunakan React.js yang di-*embed* melalui WebView (direkomendasikan WebView2) di dalam aplikasi .NET Framework 4.8.1 WinForms.
        * **AC 2**: Dasbor hanya menampilkan antrean *chat* berdasarkan `phone_number_id` yang terikat pada kredensial perusahaan agen tersebut.
    * **Story**: *Sebagai Sistem, saya ingin menyimpan dan memisahkan identitas pelanggan berdasarkan nomor layanannya agar nama/preferensi kontak tidak tertukar antar layanan.*
        * **AC 1**: Database tidak menggunakan `wa_id` sebagai *Primary Key* tunggal, melainkan *composite key* antara `wa_id` (ID kanonikal WhatsApp tanpa '+') dan `phone_number_id`.
    * **Story**: *Sebagai Agen CS, saya ingin dicegah mengirim pesan yang akan gagal secara sistem akibat pembatasan waktu dari Meta.*
        * **AC 1**: Input *chat* teks otomatis terkunci jika *timestamp* pesan terakhir pelanggan melebihi 24 jam (Jendela Layanan tertutup).
        * **AC 2**: Untuk sesi >24 jam, agen hanya disajikan opsi *dropdown* untuk mengirim *Template Message* (kategori Utilitas/Marketing) yang telah disetujui Meta.

* **Non-Goals**:
    * Tidak membangun antarmuka UI *native* WinForms untuk ruang obrolan (sepenuhnya mengandalkan React di dalam WebView).
    * Tidak membangun atau mengintegrasikan asisten AI/Chatbot otomatis pada fase ini.

## 3. AI System Requirements

* **TBD / Out of Scope**: Tidak ada sistem klasifikasi AI atau chatbot *auto-reply* pada rilis sistem saat ini. Semua interaksi dikelola oleh manusia (Agen CS).

## 4. Technical Specifications

* **Architecture Overview**:
    * **Backend (Golang)**: Bertugas sebagai *high-throughput Webhook Receiver* dan *Message Queue Manager*. Golang dipilih karena performa konkurensi (Goroutines) yang sanggup menampung 1.000 *request*/detik.
    * **Frontend Client**: Dibangun di atas .NET Framework 4.8.1 WinForms sebagai *container* (cangkang desktop). UI aktual (daftar obrolan, gelembung pesan) dirender menggunakan React.js melalui komponen WebView.
    * **Real-time Layer**: Menggunakan WebSocket dari Golang ke aplikasi React untuk mendorong (*push*) pesan baru secara instan (SLA < 200ms).

* **Integration Points**:
    * **WhatsApp Cloud API**: *Webhook* Golang harus merespons HTTP 200 secara sinkron seketika (*immediate response*) sebelum memproses pesan masuk (*asynchronous processing*).
    * **Message Queuing (Redis/RabbitMQ)**: Diintegrasikan di Golang untuk menahan/menjadwalkan laju pengiriman (*rate-limiting throttling*).

* **Security & Privacy**:
    * *Payload* *webhook* divalidasi keasliannya melalui pengecekan *header* `X-Hub-Signature-256` menggunakan HMAC SHA-256 dan *App Secret*.
    * Menerapkan *Two-Step Verification* (PIN 6-digit) pada setiap nomor `phone_number_id` yang didaftarkan ke WABA.

## 5. Database Architecture & Schema

Desain database dioptimalkan untuk arsitektur *multi-tenant*, mempermudah manajemen oleh Super Admin, dan memastikan isolasi data kontak.

### 5.1. Struktur Entitas Bisnis & Multi-Tenancy
* **Table: `companies`** (Tenant Utama)
  * `id` (UUID / BIGINT) - *Primary Key*
  * `name` (VARCHAR) - Nama perusahaan
  * `created_at` (TIMESTAMP)

* **Table: `wa_phone_numbers`**
  * `phone_number_id` (VARCHAR) - *Primary Key* (ID internal dari Meta untuk nomor bisnis).
  * `company_id` (FK, Nullable) - Relasi langsung ke tabel `companies`. `NULL` saat Super Admin baru menambahkan nomor, diisi saat di-*assign* ke perusahaan tertentu.
  * `display_phone_number` (VARCHAR) - Nomor dengan format E.164 berawalan '+' untuk tampilan UI.
  * `quality_rating` (VARCHAR) - Status rating dari Meta (GREEN, YELLOW, RED).

### 5.2. Manajemen Pengguna (Role-Based Access)
* **Table: `users`**
  * `id` (UUID) - *Primary Key*
  * `role` (ENUM: `super_admin`, `company_admin`, `agent`)
  * `company_id` (FK, Nullable) - Diisi jika *role* adalah admin perusahaan/agen. `NULL` jika `super_admin`.
  * `email` (VARCHAR) - *Unique*
  * `password_hash` (VARCHAR)

### 5.3. Isolasi Kontak Pelanggan (Contact Management)
* **Table: `contacts`**
  * `wa_id` (VARCHAR) - ID WhatsApp pelanggan (digit angka tanpa '+').
  * `phone_number_id` (FK) - Relasi ke tabel `wa_phone_numbers`.
  * **`PRIMARY KEY (wa_id, phone_number_id)`** - *Composite Key* untuk menjamin keunikan dan mencegah kebocoran kontak antar nomor.
  * `profile_name` (VARCHAR) - Nama profil asli dari WhatsApp.
  * `company_custom_name` (VARCHAR) - Nama kontak yang diubah/disimpan oleh agen CS.
  * `last_customer_message_at` (TIMESTAMP) - Penanda krusial untuk Jendela Layanan 24 Jam.

### 5.4. Transaksional Pesan & Idempotency
* **Table: `messages`**
  * `wamid` (VARCHAR) - *Primary Key*. ID unik pesan dari Meta untuk menghindari duplikasi (*idempotency key*).
  * `phone_number_id` (FK)
  * `wa_id` (FK)
  * `direction` (ENUM: `inbound`, `outbound`)
  * `type` (VARCHAR) - Tipe pesan (text, image, document, template).
  * `content` (JSONB / TEXT) - Isi pesan.
  * `status` (ENUM: `received`, `sent`, `delivered`, `read`, `failed`)
  * `timestamp` (TIMESTAMP)
  * `error_code` (INT, Nullable)
  * *Disarankan menambahkan: `INDEX(phone_number_id, wa_id, timestamp)` untuk optimasi query di Golang.*

## 6. Risks & Roadmap

* **Phased Rollout**:
    * **MVP**: Integrasi Golang Webhook, penyampaian pesan teks masuk-keluar dasar, registrasi WABA, dan *wrapper* WebView React.
    * **v1.1 (Multi-tenant)**: Penerapan *routing* terisolasi untuk semua 12 perusahaan dan dukungan pengiriman dokumen/gambar (*Media ID Caching*).
    * **v2.0 (High Availability)**: Optimasi arsitektur Golang untuk stabilisasi performa di beban 1.000 TPS.

* **Technical Risks**:
    * **Limitasi Bawaan Meta (Rate Limit)**: WhatsApp Cloud API membatasi pengiriman hulu maksimum **80 pesan per detik per nomor telepon**.
    * **Mitigasi Banned/Limit**: *Backend* Golang mengimplementasikan *worker pool* dan *Exponential Backoff*. Jika mencapai 80/detik, Golang akan menahan (*throttle*) pesan pada memori sementara (*delay* dinamis hingga 60 detik) lalu mencoba lagi, guna menjamin keamanan dari blokir Meta (*Error Code 130429*).
