# KruKit LMS • Worklog

> ใช้อ่านก่อนเริ่มงานรอบถัดไป เพื่อรู้ว่าทำอะไรไปแล้วและคิวถัดไปคืออะไร

อัปเดตล่าสุด: 20 Oct 2025 (runway ready)

---

## ✅ งานที่เสร็จ (Iteration ปัจจุบัน)

### Lightning Quiz (Beta)
- CARD/ROUTING: เพิ่ม `Lightning Quiz` ใน ClassroomToolsView และ route `/quiz` สำหรับนักเรียน (ไม่ต้องล็อกอิน).
- HOST FLOW: CRUD ชุดคำถาม (quiz_sets), สร้าง PIN/เริ่มเกม (quiz_sessions), ถามคำถามทีละข้อ, ตั้งเวลาต่อข้อ (10–120s), auto reveal เมื่อหมดเวลา, เฉลยด้วยปุ่ม, restart/จบเกม, export CSV.
- ANALYTICS: live answer count, live scoreboard (10 pts/ถูก), กราฟคะแนน Top 5, breakdown คำตอบต่อข้อหลังจบเกม.
- AI: AI Quiz Generator (ระบุวิชา/หัวข้อ/คำสำคัญ/จำนวนข้อ/ตัวเลือก/ความยาก) คืนชุดคำถามพร้อมเฉลยแล้วเติมฟอร์มอัตโนมัติ.
- STUDENT FLOW: ใส่ PIN → ตั้ง alias (บังคับ) → ตอบคำถาม; มี timer, highlight เฉลย, ปิดส่งเมื่อเฉลย/หมดเวลา; Summary หลังจบเกมโชว์คะแนนรวม, อันดับตนเอง, Top 3, รายละเอียดต่อข้อ.
- ANTI-SPAM: ผูก alias กับ deviceId, บังคับใช้ alias เดิมบนอุปกรณ์เดิม, ปฏิเสธ alias ซ้ำต่างเครื่อง, ส่งคำตอบตรวจ deviceId + กันส่งซ้ำต่อข้อ.

## 🎯 ฟีเจอร์ทั้งหมดที่วางแผน (Backlog & Next Steps)
1) **Lightning Quiz**
   - Core ที่มี: CRUD ชุดคำถาม, สร้าง PIN, เปิด/จบคำถามทีละข้อ, กันตอบซ้ำ, แสดงผู้ร่วม/ยอดคำตอบสด, เฉลย+auto reveal, scoreboard & export CSV, timer ต่อคำถาม (ตั้งค่าได้), summary breakdown (host/เด็ก), AI สร้างคำถาม, anti-spam alias+deviceId.
   - ต่อไป (ลำดับแนะนำ):
     1. Reset state ต่อข้อแบบ server-side (clear flags/อนุญาตส่งใหม่เมื่อขึ้นข้อใหม่), ปรับเวลาต่อคำถามรายข้อ
     2. Anti-spam ขั้นสูง: rate limit/ban per device, ตรวจ UA/IP (ถ้าต้องการ), ปิดการส่งเมื่อ trigger spam
     3. Summary ขั้นสูง: กราฟรวมคะแนน/เวลาตอบเฉลี่ย, รายงาน PDF/ภาพ, log activity ต่อเกม/ผู้เล่น
     4. UX เพิ่มเติม: ปุ่ม restart session จากชุดเดิม, เสียง/animation ตอนเฉลย/หมดเวลา
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
- Lightning Quiz: Beta พร้อมใช้งาน (host ถามต่อข้อ, timer/auto-reveal, summary host/เด็ก, scoreboard + กราฟ, export, AI generator, anti-spam alias+deviceId) — ยังขาด summary กราฟรวม/เวลาตอบเฉลี่ย, rate limit/ban ขั้นสูง, reset state server-side ต่อข้อ, restart session, PDF/ภาพสรุป.
- Behavior/Health/QR Passport: ยังไม่เริ่ม (อยู่ใน Backlog).
- เอกสาร/README: ยังไม่อัปเดตสำหรับฟีเจอร์ใหม่.

## 📝 หมายเหตุการใช้งาน
- Lightning Quiz ใช้ Firestore real-time (`quiz_sets`, `quiz_sessions`) จึงต้องตั้งค่า `VITE_FIREBASE_*`.
- หน้าร่วม `/quiz` พร้อมใช้งานสำหรับนักเรียน แต่ยังเป็น placeholder ระหว่างพัฒนาระบบตอบและ scoreboard.
- งานต่อไปพยายามอิงโครงสร้าง collection ที่มีอยู่ (`behavior_logs`, `health_records`, `attendance`, `savings`) เพื่อให้ dashboard เชื่อมโยงได้ง่าย.
