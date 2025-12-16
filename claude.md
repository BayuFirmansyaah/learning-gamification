# CLAUDE.md

## Project Overview

Aplikasi pembelajaran **Matematika berbasis Web 3D** menggunakan **Three.js** dengan konsep **user berjalan (FPS-style)** di sebuah lingkungan kota edukatif. Di sisi kiri dan kanan jalan terdapat **bangunan berbeda** yang berfungsi sebagai **checkpoint pembelajaran**. Saat user mencapai checkpoint, akan muncul **popup video YouTube** yang wajib ditonton sebagai materi sebelum melanjutkan.

Target utama project ini adalah:

* Interaktif
* Edukatif
* Ringan (web-friendly)
* Cocok untuk dikembangkan dengan **AI-assisted / vibecoding**

---

## Tech Stack (WAJIB DIPATUHI)

### Frontend

* Three.js (ES Modules)
* HTML + CSS (UI Overlay)
* JavaScript (Vanilla, modular)

### 3D & Asset

* Format model: `.glb / .gltf`
* Asset style: **low-poly** (web optimized)
* Source asset: Kenney / Quaternius / Sketchfab (CC0 / Free)

### Interaction

* PointerLockControls (FPS movement)
* Keyboard: WASD
* Mouse: look around
* Interaction key: `E`

---

## Core Features

### 1. Player & Movement

* FPS-style camera
* WASD movement
* Mouse look
* Camera height ±1.6
* Tidak bisa menembus bangunan
* Tidak jatuh ke bawah ground

### 2. Environment

Wajib ada:

* Jalan raya utama (panjang lurus)
* Ground / tanah
* Langit (sky color atau HDRI)
* Pohon di kiri-kanan jalan
* Bangunan di kiri-kanan jalan

Lingkungan harus terasa seperti:

> "Walking through an educational city"

---

## Building & Checkpoint System

### Building Rules

* Setiap bangunan memiliki:

  * `name`
  * `checkpointRadius`
  * `youtubeVideoId`

Contoh nama bangunan:

* Gedung_Penjumlahan
* Gedung_Pengurangan
* Gedung_Perkalian
* Gedung_Pembagian

### Checkpoint Behavior

* Saat player masuk radius checkpoint:

  * Player movement **di-pause**
  * PointerLock **di-unlock**
  * UI popup muncul

---

## Learning Popup (YouTube)

### Behavior

* Popup muncul sebagai **HTML overlay** di atas canvas
* Berisi:

  * Judul materi
  * Embedded YouTube video
  * Tombol `Lanjutkan`

### Rules

* User **WAJIB** menonton video

* Tombol `Lanjutkan` aktif setelah:

  * Video selesai, ATAU
  * Minimum watch time (misalnya 80%)

* Setelah selesai:

  * Popup ditutup
  * Player bisa bergerak lagi
  * Checkpoint dianggap selesai

---

## Asset Requirements

### Required Assets

AI HARUS MENGASUMSIKAN aset berikut tersedia dalam folder `models/`:

```
models/
  character.glb        // dummy player (optional)
  road.glb             // jalan raya
  building_1.glb       // gedung materi 1
  building_2.glb       // gedung materi 2
  tree.glb             // pohon
```

### Asset Constraints

* Low poly
* Scale konsisten
* Origin di ground
* Tidak menggunakan animasi berat

---

## Project Structure (WAJIB)

```
/src
  main.js              // entry point
  scene.js             // scene, camera, renderer
  player.js            // movement & controls
  environment.js       // road, trees, sky
  buildings.js         // building & checkpoint logic
  interaction.js       // raycaster & trigger
  ui.js                // popup learning UI
  youtube.js           // youtube embed & logic
/public
/models
index.html
style.css
```

---

## Coding Rules for AI

* Gunakan **modern Three.js (no deprecated code)**
* Jangan menulis ulang seluruh file kecuali diminta
* Kode harus:

  * Modular
  * Readable
  * Comment hanya di logic penting

### Forbidden

* Jangan gunakan framework frontend (React, Vue)
* Jangan hardcode magic numbers tanpa konstanta
* Jangan inline HTML UI di JS (harus terpisah)

---

## Performance Rules

* Shadow hanya untuk bangunan utama
* Disable shadow untuk pohon
* Gunakan `requestAnimationFrame`
* Hindari render object berlebihan

Target:

* 60 FPS di laptop standar

---

## Future Extensions (Optional)

* Progress belajar per user
* Save checkpoint (localStorage)
* Mini-map
* Quiz setelah video
* Multiplayer (future)

---

## AI Prompting Guidance

AI HARUS:

* Fokus pada **1 feature per task**
* Menjelaskan bug sebelum memperbaiki
* Menyebutkan asumsi jika asset belum ada

Contoh task valid:

> "Add checkpoint detection using distance-based trigger"

Contoh task tidak valid:

> "Build entire game"

---

## Final Goal

Sebuah **Web 3D Learning App** di mana:

* User berjalan di kota
* Setiap bangunan = materi matematika
* Belajar terasa seperti eksplorasi

**Educational, interactive, and AI-friendly.**
