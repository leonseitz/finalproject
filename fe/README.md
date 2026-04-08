# FitTracker — AI Exercise Posture Detection

แอปพลิเคชันติดตามการออกกำลังกายด้วย AI โดยใช้ MediaPipe สำหรับตรวจจับ Pose Landmark แบบ Real-time

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI, Python, SQLAlchemy, Alembic |
| Database | PostgreSQL |
| AI / Vision | MediaPipe Pose Landmarker, OpenCV |

---

## Prerequisites (สิ่งที่ต้องติดตั้งก่อน)

ก่อน clone โปรเจกต์ให้ติดตั้งโปรแกรมเหล่านี้ให้ครบ:

- [Node.js](https://nodejs.org/) v18 ขึ้นไป
- [Python](https://www.python.org/) 3.10 ขึ้นไป
- [PostgreSQL](https://www.postgresql.org/) 14 ขึ้นไป
- Git

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd finalproject
```

---

### 2. Backend Setup (FastAPI)

```bash
cd be
```

#### 2.1 สร้าง Virtual Environment

```bash
python -m venv venv
```

#### 2.2 Activate Virtual Environment

**Windows:**
```bash
.\venv\Scripts\activate
```

**macOS / Linux:**
```bash
source venv/bin/activate
```

#### 2.3 ติดตั้ง Dependencies

```bash
pip install -r requirements.txt
```

#### 2.4 ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ใน folder `be/` แล้วกำหนดค่าตามนี้:

```env
# Database Configuration
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/<database_name>

# Application Settings
APP_NAME=Exercise Posture Detection API
DEBUG=True
```

> **หมายเหตุ:** เปลี่ยน `<username>`, `<password>`, และ `<database_name>` ให้ตรงกับ PostgreSQL ที่ติดตั้งบนเครื่อง

#### 2.5 สร้าง Database

เปิด PostgreSQL แล้วสร้าง database ก่อน:

```sql
CREATE DATABASE finalproject;
```

#### 2.6 รัน Backend Server

```bash
python main.py
```

Backend จะรันที่ `http://localhost:8000`  
ดู API Docs ได้ที่ `http://localhost:8000/docs`

---

### 3. Frontend Setup (Next.js)

เปิด Terminal ใหม่แล้วไปที่ folder `fe/`:

```bash
cd fe
```

#### 3.1 ติดตั้ง Dependencies

```bash
npm install
```

#### 3.2 รัน Development Server

```bash
npm run dev
```

Frontend จะรันที่ `http://localhost:3000`

---

## Project Structure

```
finalproject/
├── be/                         # Backend (FastAPI)
│   ├── app/
│   │   ├── core/               # Config, Database connection
│   │   ├── models/             # SQLAlchemy Models
│   │   ├── routers/            # API Routes (auth, exercise, users, stats)
│   │   └── schemas/            # Pydantic Schemas
│   ├── pose_landmarker_full.task  # MediaPipe model file
│   ├── uploads/                # วิดีโอที่อัปโหลด
│   ├── main.py                 # Entry point
│   └── requirements.txt
│
└── fe/                         # Frontend (Next.js)
    ├── app/                    # Next.js App Router
    │   ├── (auth)/             # Login / Signup pages
    │   └── (main)/             # Main app pages (exercise, stats, etc.)
    ├── component/              # Reusable React Components
    ├── services/               # API service functions
    ├── utils/                  # Utility functions (pose tracking logic)
    └── constants/              # Constants
```

---

## Environment Variables Summary

| ไฟล์ | ตัวแปร | คำอธิบาย |
|------|--------|----------|
| `be/.env` | `DATABASE_URL` | Connection string สำหรับ PostgreSQL |
| `be/.env` | `APP_NAME` | ชื่อแอป (ไม่จำเป็นต้องเปลี่ยน) |
| `be/.env` | `DEBUG` | ตั้งเป็น `False` บน Production |

> **สำคัญ:** ไฟล์ `.env` ถูก ignore ด้วย `.gitignore` จะต้องสร้างใหม่ทุกครั้งที่ clone

---

## Running Both Servers

ต้องรันทั้ง Backend และ Frontend พร้อมกันใน Terminal แยกกัน:

| Terminal | คำสั่ง | URL |
|----------|--------|-----|
| Terminal 1 (Backend) | `cd be && .\venv\Scripts\activate && python main.py` | http://localhost:8000 |
| Terminal 2 (Frontend) | `cd fe && npm run dev` | http://localhost:3000 |

---

## Camera / HTTPS Note

แอปนี้ใช้กล้องสำหรับตรวจจับท่าออกกำลังกาย หากจะทดสอบบนมือถือในเครือข่ายเดียวกัน:

1. หา IP ของเครื่อง เช่น `192.168.1.x`
2. เข้าถึง Frontend ผ่าน `http://192.168.1.x:3000`
3. บางเบราว์เซอร์บนมือถืออาจต้องการ HTTPS เพื่อเข้าถึงกล้อง — สามารถใช้ `ngrok` หรือ Chrome flags เพื่อ bypass ได้

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MediaPipe Pose](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
