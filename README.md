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
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (無論本地或 Docker 部署都需要，用於資料庫)
-   [Node.js](https://nodejs.org/) (僅本地開發需要，建議 v20+)

---

### 方法一：本地端開發與運行 (Local Development)

#### 1. 安裝依賴 (Install Dependencies)

```bash
npm install
```

#### 2. 環境變數設定 (Environment Setup)

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

#### 3. Firebase 設定 (Important)

本專案使用 Firebase 發送推播。請將您的 Firebase Service Account JSON 檔案放置於：
`src/config/firebase/payoffbar-firebase-adminsdk-p5hxp-fcd8e8ca1d.json`

並確保 `src/config/firebase.ts` 中的導入代碼已正確設置。

#### 4. 啟動資料庫 (Database Setup)

使用 Docker Compose 啟動 PostgreSQL 容器：

```bash
docker-compose up -d
```

#### 5. 初始化資料庫 Schema (Prisma)

將 Prisma Schema 推送到資料庫：

```bash
npx prisma db push
```

#### 6. 啟動開發伺服器 (Run Development Server)

```bash
npm run dev
```

伺服器預設將運行在 `http://localhost:8081`。

---

### 方法二：Docker 容器化部署 (Docker Compose)

由於專案已包含 `docker-compose.yml`，這是最簡單的部署方式。它會同時啟動 PostgreSQL 資料庫與 API 伺服器。

#### 1. 設定環境變數

請確保根目錄下的 `.env` 檔案已正確設定（參考上方），特別是 `JWT_SECRET`。
`docker-compose` 會自動讀取 `.env` 檔案中的變數。

#### 2. 啟動服務 (Start Services)

執行以下指令來建置並啟動所有服務：

```bash
docker compose up -d --build
```

這將會：
1.  建置 API Server 的 Docker Image (`ipadupay-server`)。
2.  啟動 PostgreSQL 資料庫容器 (`postgres`)。
3.  啟動 API Server 容器 (`api`) 並連接到資料庫。

#### 3. 初始化資料庫

容器啟動後，第一次運行需要推送 Schema：

```bash
# 透過 API 容器執行 prisma db push
docker compose exec api npx prisma db push
```

#### 4. 驗證

API 伺服器現在應該運行在 `http://localhost:8081`。

> **提示**: 若要停止並移除所有容器，請執行 `docker-compose down`。

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