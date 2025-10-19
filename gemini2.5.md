# คู่มือการใช้งาน Gemini API Simple App

เว็บแอปพลิเคชันนี้เป็นโปรเจกต์ตัวอย่างง่ายๆ สำหรับการเชื่อมต่อกับ Gemini API โดยใช้ React และ TypeScript

## เกี่ยวกับโปรเจกต์

โปรเจกต์นี้สร้างขึ้นเพื่อแสดงวิธีการเรียกใช้ Gemini API (โมเดล `gemini-2.5-flash`) ผ่านเว็บแอปพลิเคชันที่สร้างด้วย React ผู้ใช้สามารถป้อนคำสั่ง (prompt) และรับผลลัพธ์จากโมเดล AI ได้โดยตรงผ่านหน้าเว็บ

## สิ่งที่ต้องมี (Prerequisites)

- [Node.js](https://nodejs.org/) (เวอร์ชัน 18.x หรือสูงกว่า)
- [npm](https://www.npmjs.com/) (มาพร้อมกับ Node.js)
- API Key จาก [Google AI Studio](https://aistudio.google.com/app/apikey)

## การติดตั้ง (Installation)

1.  **โคลนโปรเจกต์ (Clone the project):**
    หากคุณได้รับโปรเจกต์มาเป็นไฟล์ zip ให้แตกไฟล์ออก หรือถ้าเป็น git repository ให้ใช้คำสั่ง:
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **ติดตั้ง Dependencies:**
    เปิด Terminal หรือ Command Prompt ในโฟลเดอร์ของโปรเจกต์ แล้วรันคำสั่ง:
    ```bash
    npm install
    ```

## การตั้งค่า (Configuration)

ก่อนที่จะรันโปรเจกต์ คุณจำเป็นต้องตั้งค่า Gemini API Key ของคุณก่อน

1.  **สร้างไฟล์ `.env`:**
    ในโฟลเดอร์หลักของโปรเจกต์ ให้สร้างไฟล์ใหม่ชื่อว่า `.env`

2.  **เพิ่ม API Key:**
    เปิดไฟล์ `.env` ขึ้นมาแล้วเพิ่มค่า API Key ของคุณลงไปในรูปแบบนี้:
    ```
    API_KEY=your_gemini_api_key_here
    ```
    **สำคัญ:** ให้แทนที่ `your_gemini_api_key_here` ด้วย API Key จริงที่คุณได้รับจาก Google AI Studio

    **หมายเหตุ:** ไฟล์ `.env` เป็นไฟล์สำหรับเก็บข้อมูลสำคัญและไม่ควรถูกเปิดเผยสู่สาธารณะ

## โครงสร้างโค้ดส่วนที่เรียก API (Code Structure for API Call)

นี่คือตัวอย่างโค้ดหลักที่ใช้ในการเรียก Gemini API ภายในโปรเจกต์นี้ (จากไฟล์ `App.tsx`):

```typescript
import { GoogleGenAI } from "@google/genai";

async function callGeminiAPI(prompt: string) {
  try {
    // 1. ตรวจสอบว่ามี API Key หรือไม่
    if (!process.env.API_KEY) {
      throw new Error('ไม่พบ API Key');
    }

    // 2. สร้าง instance ของ GoogleGenAI พร้อม API Key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 3. เรียกใช้โมเดลเพื่อสร้างเนื้อหา (Generate Content)
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // ระบุโมเดลล่าสุดที่ต้องการใช้
      contents: prompt,          // ส่งคำสั่ง (prompt) ที่ต้องการ
    });

    // 4. ดึงข้อความผลลัพธ์ออกมาจาก property .text
    const text = result.text;
    
    console.log(text);
    return text;

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเรียก API:", error);
    // จัดการข้อผิดพลาดตามความเหมาะสม
  }
}

// ตัวอย่างการเรียกใช้งาน:
// callGeminiAPI("เขียนบทกวีเกี่ยวกับแมวในอวกาศ");
```

โค้ดส่วนนี้จะทำงานเมื่อผู้ใช้กดปุ่ม "สร้างคำตอบ" โดยจะส่ง `prompt` ที่ผู้ใช้ป้อนเข้าไปยัง Gemini API และนำผลลัพธ์ที่ได้กลับมาแสดงผลบนหน้าจอ

## การรันโปรเจกต์ (Running the Project)

หลังจากติดตั้งและตั้งค่าเรียบร้อยแล้ว ให้รันคำสั่งต่อไปนี้เพื่อเปิดเว็บแอปพลิเคชัน:

```bash
npm start
```

คำสั่งนี้จะเปิดเว็บเบราว์เซอร์เริ่มต้นของคุณขึ้นมาที่ `http://localhost:3000` (หรือพอร์ตอื่นหาก 3000 ไม่ว่าง) และคุณจะเห็นหน้าเว็บของ Gemini API Explorer พร้อมใช้งาน

ตอนนี้คุณสามารถพิมพ์คำสั่งที่ต้องการลงในช่องข้อความและกดปุ่ม "สร้างคำตอบ" เพื่อดูผลลัพธ์จาก AI ได้เลย!
