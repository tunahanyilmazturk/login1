# HanTech OSGB

Modern OSGB (Ortak Sağlık Güvenlik Birimi) yönetim sistemi. Firma, personel, test, ekipman, mobil araç yönetimi; teklif ve tarama oluşturma işlemlerini tek platformda birleştirir.

## Özellikler

- **Dashboard** — Anlık istatistikler, aktivite akışı ve hızlı işlemler
- **Firmalar** — Firma CRUD, sektör bazlı filtreleme, Excel export
- **Personeller** — OSGB personel yönetimi (hemşire, tekniker, uzman vb.)
- **Testler** — Test tanımları, kategorilere göre otomatik kod üretimi
- **Ekipmanlar** — Tarama cihazı ve ekipman takibi
- **Mobil Araçlar** — Gezici tarama araçları, muayene/bakım tarihi hatırlatmaları
- **Teklifler** — Firmalara test bazlı fiyat teklifi oluşturma
- **Taramalar** — Firma, personel, test ve araç kullanarak sağlık taraması kaydı
- **Karanlık/Aydınlık Tema** — Kullanıcı tercihine göre tema desteği
- **Duyarlı Tasarım** — Mobil, tablet ve masaüstü için uyumlu arayüz
- **LocalStorage** — Tüm veriler tarayıcıda saklanır, harici veritabanı gerektirmez

## Kullanılan Teknolojiler

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [React Router DOM](https://reactrouter.com/) — Sayfa yönlendirme
- [Lucide React](https://lucide.dev/) — İkon kütüphanesi
- [xlsx](https://sheetjs.com/) — Excel dışa aktarımı

## Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

## Proje Yapısı

```
src/
├── app/               # Ana stiller (App.css) ve tema bağlamı
├── features/          # Özellik bazlı sayfalar
│   ├── companies/     # Firma yönetimi
│   ├── dashboard/     # Dashboard bileşenleri
│   ├── equipment/     # Ekipman yönetimi
│   ├── login/         # Giriş sayfası
│   ├── personnel/     # Personel yönetimi
│   ├── quotes/        # Teklif oluşturma
│   ├── scans/         # Tarama kayıtları
│   ├── tests/         # Test tanımları
│   └── vehicles/      # Mobil araç yönetimi
├── layouts/           # Sidebar, Topbar, AppLayout
├── styles/            # Global stiller
├── utils/             # Yardımcı fonksiyonlar (Excel export)
├── App.tsx            # Routing ve kimlik doğrulama
└── main.tsx           # Giriş noktası
```