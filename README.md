# iPaduPay Server (Backend)

這是 iPaduPay (原 PayoffBar) 的後端伺服器專案。這是一個分帳應用程式的後端 API，支援使用者註冊、好友管理、群組分帳以及推播通知功能。

## 🛠 技術棧 (Tech Stack)

-   **Runtime**: Node.js (v20+)
-   **Framework**: Express.js
-   **Language**: TypeScript
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **Infrastructure**: Docker (for Database)
-   **Authentication**: JWT (JSON Web Tokens)
-   **Notifications**: Firebase Cloud Messaging

## ✨ 核心功能

-   **使用者系統**: 註冊、登入 (JWT 驗證)、FCM Token 管理。
-   **好友系統**: 新增好友、查詢好友列表。
-   **群組分帳**:
    -   建立群組 (包含多位成員與金額)。
    -   編輯群組 (新增/移除成員、更新金額)。
    -   查詢使用者所屬群組。
    -   查詢群組詳細資訊。
    -   刪除群組 (Cascade Delete)。
-   **通知系統**: 針對未付款成員發送 Firebase 推播提醒。

---

## 🚀 專案設置與啟動 (Getting Started)

### 1. 前置需求 (Prerequisites)

確保您的電腦已安裝：
-   [Node.js](https://nodejs.org/) (建議 v18 或 v20)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (用於執行 PostgreSQL 資料庫)

### 2. 安裝依賴 (Install Dependencies)

```bash
npm install
```

### 3. 環境變數設定 (Environment Setup)

請在專案根目錄建立 `.env` 檔案，內容如下：

```env
# API Server Port
API_SERVER_PORT=8081

# PostgreSQL Database Connection
# 格式: postgresql://[user]:[password]@[host]:[port]/[dbname]?schema=public
DATABASE_URL="postgresql://postgres:password@localhost:5432/ipadupay?schema=public"

# JWT Secret (用於簽署與驗證 Token)
JWT_SECRET=supersecretkey123
```

> **注意**: `JWT_SECRET` 請務必設定，否則登入功能會失效。

### 4. Firebase 設定 (Important)

本專案使用 Firebase 發送推播。由於資安考量，私鑰檔案不包含在 Git 版控中。

1.  請將您的 Firebase Service Account JSON 檔案放置於：
    `src/config/firebase/payoffbar-firebase-adminsdk-p5hxp-fcd8e8ca1d.json`
2.  打開 `src/config/firebase.ts`，解除相關導入代碼的註解：
    ```typescript
    import serviceAccount from './firebase/payoffbar-firebase-adminsdk-p5hxp-fcd8e8ca1d.json';

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    ```

### 5. 啟動資料庫 (Database Setup)

使用 Docker Compose 啟動 PostgreSQL 容器：

```bash
docker-compose up -d
```

### 6. 初始化資料庫 Schema (Prisma)

將 Prisma Schema 推送到資料庫：

```bash
npx prisma db push
```

### 7. 啟動開發伺服器 (Run Development Server)

```bash
npm run dev
```

伺服器預設將運行在 `http://localhost:8081`。

---

## 🧪 驗證與測試 (Verification)

專案包含一個自動化測試腳本，可驗證所有 API 流程是否正常。

**執行測試：**
(確保伺服器正在運行中)

```bash
npx ts-node src/scripts/verify-api.ts
```

測試涵蓋：
1.  使用者註冊 (A, B, C)
2.  使用者登入 (取得 Token)
3.  新增好友
4.  建立分帳群組
5.  查詢群組與詳細資料
6.  編輯與刪除群組

---

## 📁 專案結構

-   `src/app.ts`: 應用程式入口點。
-   `src/controllers/`: 業務邏輯 (User, Friend, Group)。
-   `src/models/`: (已棄用，改用 Prisma Schema)。
-   `src/routes/`: API 路由定義。
-   `src/config/`: 設定檔 (Prisma, Firebase)。
-   `prisma/schema.prisma`: 資料庫模型定義。