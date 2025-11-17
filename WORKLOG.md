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

## 🎯 คิวถัดไป (เรียงลำดับ)
1. Lightning Quiz - ระบบตอบจริง (UI คำถาม/เลือกคำตอบ, บันทึกคะแนน, scoreboard live).
2. ปรับ `BehaviorLoggerModal` และ `StudentProfileModal` ให้รองรับการเลือกวันที่ และแสดง timeline พร้อมวันที่ชัดเจน.
3. เพิ่ม timestamp (วันที่ + เวลา) ให้ข้อมูลสุขภาพ และ visualize ความเปลี่ยนแปลง (กราฟ/ตารางเรียงตามเวลา).
4. ออกแบบ/เริ่มต้นระบบ `QR Student Passport` สำหรับสแกนเช็คชื่อ + dashboard ส่วนตัวของนักเรียน.

## 📝 หมายเหตุการใช้งาน
- Lightning Quiz ใช้ Firestore real-time (`quiz_sets`, `quiz_sessions`) จึงต้องตั้งค่า `VITE_FIREBASE_*`.
- หน้าร่วม `/quiz` พร้อมใช้งานสำหรับนักเรียน แต่ยังเป็น placeholder ระหว่างพัฒนาระบบตอบและ scoreboard.
- งานต่อไปพยายามอิงโครงสร้าง collection ที่มีอยู่ (`behavior_logs`, `health_records`, `attendance`, `savings`) เพื่อให้ dashboard เชื่อมโยงได้ง่าย.
