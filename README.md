# KruKit • Banwanghin LMS AI

**KruKit** (ครูคิท) คือเว็บแอปพลิเคชันช่วยครูยุคใหม่ที่โรงเรียนบ้านวังหินพัฒนาขึ้นเพื่อให้ครูไทยจัดการชั้นเรียน รายวิชา นักเรียน และแผนการสอนด้วยพลังของ **AI + ข้อมูลเรียลไทม์** บนเทคโนโลยี web สมัยใหม่ (React + Vite + Firebase + Gemini).

- AI ช่วยสร้างใบงาน/ข้อสอบและแผนการสอนภายในไม่กี่คลิก
- แดชบอร์ดภาพรวมโรงเรียน แจ้งเด็กที่ต้องติดตาม และจัดอันดับนักเรียนยอดเยี่ยม
- จัดการข้อมูลนักเรียน สุขภาพ พฤติกรรม ระบบออมทรัพย์ พร้อมเชื่อม LINE แจ้งผู้ปกครอง
- โอเพนซอร์ส ติดตั้งเองได้ ข้อมูลอยู่บนบัญชี Firebase ของโรงเรียน

> ⚠️ คู่มือนี้ออกแบบเป็น *“จับมือทำ”* สำหรับผู้ที่ดาวน์โหลดโปรเจ็กต์จาก GitHub แล้วไม่เคยตั้งค่ามาก่อน หากทำครบทุกขั้นตอนจะได้ระบบพร้อมใช้งานในเครื่อง หรือสามารถนำขึ้นเซิร์ฟเวอร์ของโรงเรียนได้ทันที

---

## สารบัญ

1. [สิ่งที่ต้องเตรียมก่อนเริ่ม](#สิ่งที่ต้องเตรียมก่อนเริ่ม)
2. [ดาวน์โหลดและติดตั้งโปรเจ็กต์](#ดาวน์โหลดและติดตั้งโปรเจ็กต์)
3. [สร้างและตั้งค่า Firebase](#สร้างและตั้งค่า-firebase)
4. [ตั้งค่าไฟล์สภาพแวดล้อม (.env)](#ตั้งค่าไฟล์สภาพแวดล้อม-env)
5. [ทดสอบรันบนเครื่อง (Development)](#ทดสอบรันบนเครื่อง-development)
6. [เตรียมพร้อมใช้งานจริง/ขึ้นเซิร์ฟเวอร์](#เตรียมพร้อมใช้งานจริงขึ้นเซิร์ฟเวอร์)
7. [โครงสร้างข้อมูล Firestore ที่ควรรู้](#โครงสร้างข้อมูล-firestore-ที่ควรรู้)
8. [การเชื่อมต่อบริการเสริม (Line / Apps Script)](#การเชื่อมต่อบริการเสริม-line--apps-script)
9. [ปรับแต่งเพิ่มเติม](#ปรับแต่งเพิ่มเติม)
10. [คำถามที่พบบ่อย & การแก้ปัญหา](#คำถามที่พบบ่อย--การแก้ปัญหา)

---

## สิ่งที่ต้องเตรียมก่อนเริ่ม

| รายการ | รายละเอียด |
| --- | --- |
| **คอมพิวเตอร์** | Windows / macOS / Linux ที่ติดตั้ง Node.js ได้ |
| **Node.js** | เวอร์ชัน 18 ขึ้นไป (แนะนำ 20 LTS) โหลดจาก [nodejs.org](https://nodejs.org/) |
| **Git** | ใช้สำหรับดาวน์โหลดโค้ดจาก GitHub – โหลดจาก [git-scm.com](https://git-scm.com/) |
| **บัญชี Google** | เพื่อสร้างโปรเจ็กต์ใน [Firebase Console](https://console.firebase.google.com/) และรับ Gemini API Key |
| **เครื่องมือแก้ไขโค้ด** | VS Code หรือ IDE ที่ถนัด |
| (ทางเลือก) บัญชี LINE Developers | สำหรับเชื่อมต่อระบบแจ้งเตือนผ่าน LINE Messaging API |

หลังจากติดตั้ง Node.js ให้เปิด Terminal/Command Prompt แล้วพิมพ์ `node -v` และ `npm -v` เพื่อยืนยันว่าใช้งานได้

---

## ดาวน์โหลดและติดตั้งโปรเจ็กต์

1. **เปิด Terminal / PowerShell / Command Prompt**
2. เลือกโฟลเดอร์ปลายทางที่ต้องการเก็บโปรเจ็กต์ (เช่น `D:\Projects`)
3. รันคำสั่ง
   ```bash
   git clone https://github.com/nzdev2025/banwanghin-lms-ai-main.git
   cd banwanghin-lms-ai-main
   ```
4. ติดตั้งแพ็กเกจที่โปรเจ็กต์ต้องใช้
   ```bash
   npm install
   ```
   หากติดตั้งเสร็จจะเห็นโฟลเดอร์ `node_modules` และไม่มีข้อความ error

---

## สร้างและตั้งค่า Firebase

> จุดประสงค์: เราจะเชื่อม KruKit กับบัญชี Firebase ของโรงเรียนเพื่อเก็บข้อมูล (Firestore), จัดการการเข้าสู่ระบบ (Authentication) และดึงไฟล์ต่าง ๆ

### 1) สร้างโปรเจ็กต์ใหม่
1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก **Add project** → ตั้งชื่อ เช่น `banwanghin-lms-demo`
3. ปิด Google Analytics (ถ้าไม่ต้องการ) → สร้างโปรเจ็กต์

### 2) เปิดใช้งาน **Authentication**
1. ในเมนูซ้ายเลือก **Build → Authentication**
2. กด **Get started**
3. แท็บ **Sign-in method** → เปิดใช้งาน **Email/Password**

### 3) เปิดใช้งาน **Cloud Firestore**
1. เมนูซ้ายเลือก **Firestore Database**
2. กด **Create database**
3. เลือกโหมด Production หรือ Test แล้วแต่การใช้งาน (เริ่มต้น Test ได้ง่ายกว่า)
4. เลือก Region ที่ใกล้ไทยที่สุด (เช่น asia-southeast1)
5. กด **Enable**

> ⚠️ สิทธิ์ของ Firestore ในโหมด Production ควรตั้ง Rules ให้ปลอดภัยก่อนใช้งานจริง ดูตัวอย่างกติกาในหัวข้อ [โครงสร้างข้อมูล Firestore ที่ควรรู้](#โครงสร้างข้อมูล-firestore-ที่ควรรู้)

### 4) เปิดใช้งาน **Storage** (ถ้าต้องการจัดการไฟล์)
1. เมนู **Build → Storage**
2. กด **Get started** และเลือก Region เดียวกับ Firestore

### 5) รับค่า **Firebase Config**
1. คลิกไอคอน **⚙️ (Project settings)** มุมซ้ายบน
2. ที่หัวข้อ **Your apps** → กดปุ่ม **</>** (สำหรับ Web app)
3. ตั้งชื่อ เช่น `KruKit Web` และเลือก **Use existing hosting** = ไม่จำเป็น (เว้นไว้)
4. กด **Register app** → **Continue to console**
5. เลื่อนลงส่วน **Firebase SDK snippet** → แท็บ **Config** → เก็บค่าที่ได้ไว้ (API key, projectId, ฯลฯ)

---

## ตั้งค่าไฟล์สภาพแวดล้อม (.env)

ในโปรเจ็กต์จะมีไฟล์ตัวอย่าง `.env.example` ให้ทำตามนี้

1. คัดลอกไฟล์
   ```bash
   copy .env.example .env       # Windows
   # หรือ cp .env.example .env  # macOS / Linux
   ```
2. เปิดไฟล์ `.env` ด้วยโปรแกรมแก้ไข เช่น VS Code
3. แทนที่ค่าทั้งหมดด้วยข้อมูลของคุณ

| ตัวแปร | ต้องกรอก | อธิบาย |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | ✅ | API Key จากขั้นตอน Firebase Config |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | เช่น `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | ID โปรเจ็กต์ Firebase (ห้ามมีช่องว่าง) |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | เช่น `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | เลขชุดยาว 12-13 หลัก |
| `VITE_FIREBASE_APP_ID` | ✅ | ค่า `appId` จาก Firebase |
| `VITE_GEMINI_API_KEY` | ✅ (หากใช้ฟีเจอร์ AI) | รับจาก [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `VITE_APPS_SCRIPT_URL` | ❇️ (ทางเลือก) | URL จาก Google Apps Script หากใช้ฟีเจอร์พิมพ์เอกสาร ปพ.5 |

> หากยังไม่ได้เปิดบริการ AI หรือ Apps Script ให้ใส่ค่าเป็นสตริงว่าง (`""`) ไปก่อน ระบบจะแจ้งเตือนเมื่อฟีเจอร์นั้นถูกเรียกใช้งาน

---

## ทดสอบรันบนเครื่อง (Development)

1. ยังคงอยู่ในโฟลเดอร์โปรเจ็กต์ รันคำสั่ง
   ```bash
   npm run dev
   ```
2. Vite จะขึ้นข้อความคล้าย
   ```
   ➜  Local:   http://localhost:5173/
   ```
3. เปิดเบราว์เซอร์แล้วเข้าลิงก์ดังกล่าว จะเห็นหน้าเข้าสู่ระบบ KruKit
4. สร้างบัญชีผู้ดูแลระบบด้วยการกด “สร้างบัญชีผู้ดูแลโรงเรียน” (ข้อมูลจะถูกบันทึกใน Firebase ของคุณ)
5. ทดลองเพิ่มรายวิชา นักเรียน และใช้งานฟีเจอร์ต่าง ๆ

หยุดเซิร์ฟเวอร์โดยกด `Ctrl + C` ใน Terminal

---

## เตรียมพร้อมใช้งานจริง/ขึ้นเซิร์ฟเวอร์

1. **สร้างไฟล์ Production**  
   ```bash
   npm run build
   ```
   ไฟล์สำหรับใช้งานจริงจะอยู่ในโฟลเดอร์ `dist/`

2. **ตัวเลือกการนำขึ้นใช้งาน**
   - **Firebase Hosting** (ง่ายที่สุดกับระบบปัจจุบัน)  
     - ติดตั้ง CLI: `npm install -g firebase-tools`  
     - เข้าสู่ระบบ: `firebase login`  
     - ตั้งค่า: `firebase init hosting` (เลือกโปรเจ็กต์เดียวกับ Firestore)  
     - Deploy: `firebase deploy --only hosting`
   - **เซิร์ฟเวอร์อื่น** เช่น Nginx/Apache  
     - คัดลอกไฟล์ทั้งหมดใน `dist/` ไปไว้ในโฟลเดอร์เว็บ
     - ตั้งค่า Reverse Proxy ให้ชี้ไปที่ `index.html` (Single Page App)

> หากโรงเรียนต้องการแยกฐานข้อมูลระหว่างการทดสอบ/ใช้งานจริง ให้สร้างโปรเจ็กต์ Firebase เพิ่มแล้วอัปเดตค่าในไฟล์ `.env`

---

## โครงสร้างข้อมูล Firestore ที่ควรรู้

ระบบจะอ่าน/เขียนข้อมูลภายใต้ path หลัก `artifacts/<APP_ID>/public/data/` โดยค่า `<APP_ID>` ดีฟอลต์คือ `banwanghin-lms-dev` (กำหนดใน `src/firebase/firebase.js`) – สามารถเปลี่ยนได้หากต้องการแยกข้อมูลหลายโรงเรียน

โครงสร้างที่ใช้งานบ่อย เช่น

```
artifacts/{appId}/public/data/
 ├─ subjects_meta/…                → Metadata รายวิชา
 ├─ subjects/{subjectId}/grades/{grade}/assignments
 ├─ subjects/{subjectId}/grades/{grade}/scores
 ├─ rosters/{grade}/students/…     → นักเรียนแยกตามชั้น
 ├─ savings/{grade}/students/{studentId}/transactions
 ├─ activity_log/…                 → รายการเคลื่อนไหวในแดชบอร์ด
```

### สิทธิ์ Firestore (Rules) แบบแนะนำเบื้องต้น
> ⚠️ ปรับตามนโยบายข้อมูลของโรงเรียนก่อนใช้งานจริง
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // จำกัดเฉพาะผู้ที่ล็อกอิน
    match /artifacts/{appId}/public/data/{document=**} {
      allow read, write: if request.auth != null;
    }
    // Log / อื่น ๆ ปรับเพิ่มตามความเหมาะสม
  }
}
```

---

## การเชื่อมต่อบริการเสริม (Line / Apps Script)

### LINE Messaging API สำหรับแจ้งเตือนเช็คชื่อ
1. ไปที่ [LINE Developers Console](https://developers.line.biz/console)
2. สร้าง **Provider** และ **Messaging API Channel**
3. เก็บค่า Channel Access Token & Secret ไว้ (ช่วงต่อไปจะมีโมดูลพร้อมรองรับ)
4. ตั้ง Webhook URL เป็นฟังก์ชันที่โรงเรียนคุณใช้ (ต้องพัฒนาเพิ่มหรือเชื่อมกับ Cloud Functions)
5. ปรับโค้ดในส่วนที่เกี่ยวกับการส่งข้อความ (ค้นหา `lineNotify` ในโปรเจ็กต์)

> ในปัจจุบันโปรเจ็กต์เตรียม hook ไว้ที่ฝั่ง UI หากต้องการส่งข้อความจริงจำเป็นต้องมี Backend/Cloud Function รับค่าและส่งผ่าน LINE Messaging API

### Google Apps Script สำหรับสร้างเอกสาร ปพ.5
1. เปิด Google Sheets → Extensions → Apps Script
2. วางสคริปต์ที่จัดรูปแบบรายงาน ปพ.5 ตามแบบของโรงเรียน
3. Deploy → *New deployment* → ประเภท **Web app**
4. เลือก **Anyone with Google account** (หรือปรับตามนโยบาย)
5. คัดลอก URL ที่ได้ → วางลงใน `VITE_APPS_SCRIPT_URL` ในไฟล์ `.env`

---

## ปรับแต่งเพิ่มเติม

- เปลี่ยนโลโก้/ชื่อโรงเรียน: แก้ที่ `src/components/layout/Header.jsx` และ `Sidebar.jsx`
- เปลี่ยนสีธีมรายวิชา: แก้ค่าที่ `src/constants/theme.js`
- ตั้งค่า appId เฉพาะ: แก้ที่ `src/firebase/firebase.js` บรรทัด `export const appId = ...`
- เพิ่มฟีเจอร์ใหม่: ใช้ React component ภายใต้ `src/components` และ `src/views`
- ตรวจสอบโค้ดด้วย ESLint: `npm run lint`

---

## คำถามที่พบบ่อย & การแก้ปัญหา

| อาการ | วิธีแก้ |
| --- | --- |
| เปิดเว็บแล้วเจอหน้าจอว่าง/แดชบอร์ดไม่โหลด | ตรวจสอบคอนโซลเบราว์เซอร์ (F12) ว่ามี error เรื่องสิทธิ์หรือ Firebase config หรือไม่ |
| ล็อกอินไม่ได้ ขึ้น “Firebase: Error (auth/…)” | ยืนยันว่าเปิด Email/Password sign-in ใน Firebase แล้ว และบัญชีถูกสร้างจริง |
| ขึ้นเตือน “Firebase environment variable … is not set” ใน Terminal | ตรวจสอบไฟล์ `.env` ว่าใส่ค่าครบทุกตัวและเซฟไฟล์แล้ว |
| เรียกฟีเจอร์ AI แล้วไม่ตอบสนอง | ตรวจสอบว่ามีค่า `VITE_GEMINI_API_KEY` และไม่หมดโควตา |
| ต้องการใช้ข้อมูลร่วมกันหลายโรงเรียน | เปลี่ยน `appId` ให้ต่างกันแต่ใช้ codebase เดียวกัน หรือแยก Firebase project |
| กังวลเรื่องความปลอดภัย | ตั้ง Firestore Rules และจำกัดสิทธิ์ผู้ใช้งานใน Firebase Authentication ให้เข้าถึงเฉพาะครู/ผู้ดูแล |

หากพบปัญหาที่แก้ไม่ได้ สามารถเปิด Issues ใน GitHub หรือทักมาที่ Wasin (Nzdev) เพื่อปรึกษาและอัปเดตฟีเจอร์ร่วมกัน

---

## License

โค้ดชุดนี้เปิดให้ใช้งานและพัฒนาต่อได้ภายใต้เงื่อนไขโอเพนซอร์สของผู้พัฒนาโรงเรียนบ้านวังหิน โปรดตรวจสอบ LICENSE (หากระบุไว้) หรือสอบถามเพิ่มเติมก่อนใช้งานในเชิงพาณิชย์

ขอให้สนุกกับการยกระดับห้องเรียนไทยด้วย AI! 🚀

