# เกมต่อสู้ 2 มิติ (2D Fighting Game)

## ภาพรวม
นี่คือเกมต่อสู้ 2 มิติที่พัฒนาด้วย **HTML5, CSS และ JavaScript** โดยใช้ **Canvas API** สำหรับการเรนเดอร์และ **GSAP** สำหรับการทำแอนิเมชัน ตัวเกมประกอบด้วยตัวละคร 2 ตัว คือ ผู้เล่นและศัตรู ที่สามารถต่อสู้กันได้โดยมีแถบพลังชีวิตและตัวจับเวลาการแข่งขัน

## คุณสมบัติของเกม
- **แอนิเมชันตัวละคร** ในหลากหลายสถานะ (อยู่เฉย ๆ, วิ่ง, กระโดด, โจมตี, โดนโจมตี และตาย)
- **แถบพลังชีวิต** ที่อัปเดตแบบเรียลไทม์
- **ระบบตรวจจับการชนกัน** เพื่อให้การโจมตีมีผล
- **ตัวจับเวลา** เพื่อกำหนดผู้ชนะ
- **ควบคุมตัวละครด้วยแป้นพิมพ์**
- **ฉากหลังและแอนิเมชันตัวละครที่สมจริง**

## วิธีติดตั้ง
1. โคลน Repository:
   ```sh
   git clone https://github.com/yourusername/2d-fighting-game.git
   ```
2. ไปที่โฟลเดอร์ของโปรเจกต์:
   ```sh
   cd 2d-fighting-game
   ```
3. เปิด `index.html` ในเว็บเบราว์เซอร์เพื่อเริ่มเล่นเกม

## วิธีเล่น
- **การควบคุมผู้เล่น:**
  - เดินไปทางซ้าย: `A`
  - เดินไปทางขวา: `D`
  - กระโดด: `W`
  - โจมตี: `Space`

- **การควบคุมศัตรู:**
  - เดินไปทางซ้าย: `ลูกศรซ้าย`
  - เดินไปทางขวา: `ลูกศรขวา`
  - กระโดด: `ลูกศรขึ้น`
  - โจมตี: `ลูกศรลง`

## เครดิต
- **ผู้พัฒนาเกม:** (ใส่ชื่อของคุณ)
- **แหล่งที่มาของสไปรต์และทรัพยากร:** (ระบุหากนำมาจากแหล่งอื่น)
- **ไลบรารีที่ใช้:** [GSAP](https://greensock.com/gsap/)

## ลิขสิทธิ์
โครงการนี้ใช้สัญญาอนุญาตแบบ MIT คุณสามารถแก้ไขและแจกจ่ายได้ตามต้องการ!

