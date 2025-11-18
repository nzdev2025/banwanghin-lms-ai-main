# KruKit LMS • Worklog

> ใช้อ่านก่อนเริ่มงานรอบถัดไป เพื่อรู้ว่าทำอะไรไปแล้วและคิวถัดไปคืออะไร

อัปเดตล่าสุด: 20 Oct 2025

---

## ✅ งานที่เสร็จ (Iteration ปัจจุบัน)

### Lightning Quiz (Beta)
- ลบ Kahoot Hub เดิม และแทนที่ด้วย `Lightning Quiz` card ใน `ClassroomToolsView`.
- สร้าง `LightningQuizModal.jsx` ที่ให้ครู:
  - สร้าง/จัดการชุดคำถามแบบปรนัยในแอป (บันทึกลง `artifacts/<appId>/public/data/quiz_sets`).
  - กดสร้าง PIN เพื่อเริ่ม session (`quiz_sessions`) พร้อม host console + scoreboard placeholder.
  - เตรียมต่อยอดไปยัง student join/response (ยัง pending).
- อัปเดต `App.jsx` ให้เปิด modal ใหม่นี้ (key: `lightningQuiz`).
- เพิ่ม `LightningQuizJoinView` และปรับ `App.jsx` ให้ route `/quiz` ใช้งานได้โดยไม่ต้องล็อกอิน → นักเรียนสามารถใส่ PIN เพื่อเข้าร่วม (ยังเป็น placeholder).
- เพิ่มปุ่ม copy join link ใน host console เพื่อแชร์ `/quiz`.
- เพิ่มระบบถาม-ตอบพื้นฐาน: host “ถามคำถามถัดไป”, นักเรียนตอบได้ (ตอบครั้งเดียวต่อคำถาม), แสดงจำนวนผู้เข้าร่วม + live count คำตอบใน host console.
- เพิ่ม CRUD ชุดคำถาม (สร้าง/แก้ไข/ลบ) บนมอดอลเดียวกัน.
- ฝั่งนักเรียนบังคับตั้งชื่อเล่นหลังกรอก PIN, เก็บ participants และกันส่งซ้ำในคำถามเดียวกัน.
- เพิ่ม live scoreboard (คำนวณคะแนน 10 คะแนนต่อคำตอบถูก) จากคำตอบทั้งหมดของ session.
- Host มีชุดสรุปเบื้องต้น (ยอดผู้เข้าร่วม, จำนวนตอบรวม) และปุ่มส่งออก CSV สรุปคะแนน.
- เพิ่มปุ่ม “เฉลยคำตอบ” ใน host; ฝั่งเด็กแสดง highlight “ถูก/ผิด” และปิดการส่งคำตอบเมื่อเฉลยแล้ว.
- เพิ่มตัวจับเวลา 20s ต่อคำถาม (host/เด็กเห็นเวลานับถอยหลัง) และตั้งเวลาจบคำถามใน session.
- เพิ่ม auto reveal (เฉลยอัตโนมัติเมื่อเวลาหมด) และเด็กจะถูกบล็อกส่งคำตอบเมื่อหมดเวลา.
- ปรับ host กำหนดเวลาต่อคำถามได้ (10-120s) ก่อนเริ่ม session; questionEndsAt ถูกตั้งตามค่านี้.
- เพิ่ม summary หลังจบเกมบน host (ต่อข้อมี breakdown คำตอบ + scoreboard) และ export CSV ได้.
- Anti-spam เบื้องต้น: ยืนยันชื่อเล่นผูกกับ deviceId; ปฏิเสธ alias เดิมจากอุปกรณ์อื่น; ส่งคำตอบต้องมี participant ที่ deviceId ตรงกัน; ถ้า device เคยลงทะเบียน alias แล้วจะบังคับใช้อัตโนมัติ.
- เพิ่มกราฟคะแนน (BarChart) ใน scoreboard (Top 5) หลังจบเกม/ระหว่างเล่น.

## 🎯 ฟีเจอร์ทั้งหมดที่วางแผน (Backlog & Next Steps)
1) **Lightning Quiz**
   - Core ที่มี: CRUD ชุดคำถาม, สร้าง PIN, เปิด/จบคำถามทีละข้อ, กันตอบซ้ำ, แสดงผู้ร่วม/ยอดคำตอบสด, เฉลยคำตอบ, scoreboard & export CSV, timer ต่อคำถาม (ตั้งค่าได้), auto reveal, summary breakdown หลังจบเกม, anti-spam alias+deviceId.
   - ต่อไป: รีเซ็ต state ต่อคำถามอัตโนมัติ, สรุปผลหลังจบเกมแบบกราฟ/บันทึกกิจกรรม, ป้องกัน spam หลายอุปกรณ์ขั้นสูง (rate limit/ban), แสดงเฉลยถูก-ผิดย้อนหลัง/ประวัติผู้เล่น, ปรับเวลาต่อคำถามได้ทีละข้อ, auto-reveal พร้อมแสดง breakdown/เฉลยย้อนหลัง, soft reset ให้เด็กส่งคำตอบใหม่เมื่อคำถามถัดไปเริ่ม.
2) **Behavior Timeline**
   - ปรับ `BehaviorLoggerModal` ให้เลือกวันที่ย้อนหลังได้ (มี default วันนี้).
   - ปรับ `StudentProfileModal` ให้แสดง timeline เรียงตามเวลา + filter ช่วงวันที่.
3) **Health Records with Time**
   - เพิ่มการบันทึก timestamp (วันที่+เวลา) ต่อเรคคอร์ดสุขภาพ.
   - เพิ่มกราฟ/ตารางเทียบเวลา (น้ำหนัก/ส่วนสูง) + export ที่มีเวลารวม.
4) **QR Student Passport**
   - Flow สแกน QR เพื่อลงชื่อเข้าเรียน + แสดง dashboard ส่วนตัว (คะแนน, ส่งงาน, สุขภาพ, ออมทรัพย์, พฤติกรรม, สรุป AI).
   - ใช้ token หมดอายุ ป้องกันแชร์ลิงก์, รองรับ QR/ลิงก์เฉพาะห้อง/รายคน.
5) **Docs/UX**
   - อัปเดต README/คู่มือย่อสำหรับฟีเจอร์ใหม่ (Lightning Quiz, QR Passport) หลังฟีเจอร์เสถียร.
   - เพิ่มคำอธิบาย quick start ในแอป/tooltip เท่าที่จำเป็น.

## 📌 สถานะปัจจุบัน (20 Oct 2025)
- Lightning Quiz: เล่นได้ระดับ Beta (host ถามคำถาม, timer ปรับได้, auto-reveal, breakdown หลังเกม, anti-spam alias+deviceId, scoreboard 10pts/ถูก, export CSV) — ยังไม่มี summary แบบกราฟ/บันทึกกิจกรรม และ anti-spam ขั้นสูง.
- Behavior/Health/QR Passport: ยังไม่เริ่ม (อยู่ใน Backlog).
- เอกสาร/README: ยังไม่อัปเดตสำหรับฟีเจอร์ใหม่.

## 📝 หมายเหตุการใช้งาน
- Lightning Quiz ใช้ Firestore real-time (`quiz_sets`, `quiz_sessions`) จึงต้องตั้งค่า `VITE_FIREBASE_*`.
- หน้าร่วม `/quiz` พร้อมใช้งานสำหรับนักเรียน แต่ยังเป็น placeholder ระหว่างพัฒนาระบบตอบและ scoreboard.
- งานต่อไปพยายามอิงโครงสร้าง collection ที่มีอยู่ (`behavior_logs`, `health_records`, `attendance`, `savings`) เพื่อให้ dashboard เชื่อมโยงได้ง่าย.
