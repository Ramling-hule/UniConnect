# 🎓 UniConnect

![Node.js](https://img.shields.io/badge/Node.js-green?style=flat&logo=node.js) ![Express](https://img.shields.io/badge/Express-blue?style=flat&logo=express) ![MongoDB](https://img.shields.io/badge/MongoDB-green?style=flat&logo=mongodb) ![Redis](https://img.shields.io/badge/Redis-red?style=flat&logo=redis) ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=flat&logo=socket.io)

**UniConnect** is a robust social networking platform designed for university students and professionals. It facilitates connections, community building via groups, and real-time interaction through posts and messaging.

The backend is engineered for performance, utilizing **Redis caching** for high-traffic endpoints and **Socket.io** for instant notifications.

---

## 🚀 Key Features

### 🌐 Social Network
* **Connection System:** Send, accept, or ignore connection requests (LinkedIn-style).
* **Discovery:** Smart suggestions for users based on institute and mutual connections.
* **Profiles:** Detailed user profiles with education, headlines, and activity.

### 📝 Feed & Interaction
* **Rich Media Posts:** Create posts with text and images (hosted on **Cloudinary**).
* **Engagement:** Like and comment on posts in real-time.
* **Smart Caching:** High-performance feed rendering using Redis.

### 👥 Groups & Communities
* **Public & Private Groups:** Create open communities or institute-exclusive private groups.
* **Admin Tools:** Manage join requests, approve members, and moderate content.
* **Group Chat:** Real-time messaging history within groups.

### ⚡ Performance & Real-Time
* **Redis Caching:** Implements the **Cache-Aside** strategy for Feed, Profiles, and Group Lists.
* **Session Management:** Secure, persistent sessions stored in Redis Cloud.
* **Live Notifications:** Instant alerts for connection requests and group invites via **Socket.io**.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | Node.js, Express.js | RESTful API architecture |
| **Database** | MongoDB (Mongoose) | Primary persistent data store |
| **Caching** | **Redis Cloud** | Session store & API response caching |
| **Real-Time** | Socket.io | WebSockets for notifications & chat |
| **Media** | Cloudinary | Cloud storage for user uploads |
| **Auth** | Express-Session | Secure, Redis-backed session management |

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/Ramling-hule/UniConect.git](https://github.com/Ramling-hule/UniConect.git)
cd UniConect