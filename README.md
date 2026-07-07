# HanTech OSGB

Modern OSGB (Ortak Sağlık Güvenlik Birimi) yönetim sistemi. Saha operasyonları, eğitim takibi ve denetim raporlamayı kurumsal güvenlikle buluşturan platform.

## Özellikler

- **Saha Operasyon Yönetimi** — Personel kaydı, görev atama ve takip
- **Dijital Eğitim Takibi** — Aktif/planlı eğitimler, sertifika yönetimi
- **Denetim Raporlama** — Sahada denetim, bulgu tespiti ve raporlama
- **Dashboard** — Anlık istatistikler, aktivite akışı ve hızlı işlemler
- **Karanlık/Aydınlık Tema** — Kullanıcı tercihine göre tema desteği
- **Duyarlı Tasarım** — Mobil, tablet ve masaüstü için uyumlu arayüz

## Kullanılan Teknolojiler

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Lucide React](https://lucide.dev/) — İkon kütüphanesi

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
├── components/       # Bileşenler
│   └── dashboard/    # Dashboard bileşenleri
├── layouts/          # Sayfa düzenleri (Sidebar, Topbar, AppLayout)
├── pages/            # Sayfalar
├── App.tsx           # Ana uygulama (giriş ve dashboard shell)
├── App.css           # Ana stiller
├── ThemeContext.tsx   # Tema yönetimi
└── main.tsx          # Giriş noktası
```
