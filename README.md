# 🎯 BGMI INTEL — Full-Stack Esports Analytics & Media Hub Platform

![BGMI Intel Platform](public/bgmi-banner-placeholder.png)

**BGMI Intel** is a professional, full-stack esports tournament operations, performance analytics, and media asset management platform designed specifically for **Battlegrounds Mobile India (BGMI)**.

Built with a high-performance **React 18 + Vite** frontend, a high-throughput **FastAPI (Python)** REST backend, an automated **ETL Data Pipeline**, and an integrated **BGMI Media Hub**, BGMI Intel delivers real-time match telemetry, team head-to-head intelligence, map rotation heatmaps, and high-resolution esports media downloads.

---

## ⚡ Key Features & Highlights

### 🏆 1. Esports Tournament Operations & Analytics
* **Live Tournament Hub**: Multi-stage tournament leaderboards (Group Stage, Semifinals, Grand Finals), placement vs. finish points split, WWCD tracking, and game-by-game breakdowns.
* **Interactive Dashboard**: Top team rankings, MVP leaderboards, live match tickers, map frequency stats, and overall tournament progress.
* **Team & Player Intelligence**: In-depth player rosters, eliminations/damage/assists metrics, drop spot preferences, favorite weapons, and team performance trends.
* **Versus View (Head-to-Head Comparison)**: Direct side-by-side team comparisons, radar capability charts, historical match combat records, and head-to-head win rates.

### 🗺️ 2. Tactical Map Intelligence (Map Intel)
* **Interactive BGMI Maps**: Full tactical overview for **Erangel**, **Miramar**, **Sanhok**, **Vikendi**, and **Nusa**.
* **Heatmap Overviews**: Drop zone distribution, high-frequency rotation paths, compound control telemetry, and lethal combat zones.
* **Zone Strategy**: Phase-by-phase zone shift analytics and drop spot conflict analysis.

### 🖼️ 3. BGMI Media Hub
* **Esports Asset Gallery**: Curated repository of high-resolution 4K BGMI wallpapers, tournament highlight clips, team roster photography, vector graphics, and event banners.
* **Advanced Search & Filtering**: Multi-facet search by title, tag, resolution, aspect ratio, and asset category.
* **High-Speed Downloads**: One-click asset download engine with direct file download capabilities.
* **Media Management & Admin Tools**: Integrated uploader modal with tag management, resolution auto-detection, view/download counters, and like tracking.

### 🔄 4. Data Pipeline & Scraper (ETL)
* **Web Scraping & Cleaning**: Python scrapers to extract match data, team scores, player eliminations, and tournament statistics from esports websites (including EsportStats and Liquipedia structures).
* **Data Transformation**: Automated data sanitization, schema normalization, and database ingestion into SQLite (`bgmi_intel.db`).

### 🧪 5. Automated QA & Testing Suite
* **Comprehensive Test Coverage**: Included Python test suite (`test_qa_suite.py`) providing 100% pass rates across database integrity, REST API endpoints, Media Hub schemas, and calculation engines.

---

## 🛠️ Technology Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **Frontend** | React 18, Vite, Lucide React Icons, Custom Dark Theme CSS, Responsive Grid Layouts |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic V2, SQLite 3 |
| **Data Pipeline** | Python, BeautifulSoup4, Requests, Pandas, SQLite ORM |
| **Testing** | Custom Python QA Test Suite (`unittest` / `requests`) |
| **Version Control** | Git, GitHub |

---

## 📁 Repository Directory Structure

```
BGMI-INTEL/
├── data-pipeline/               # Data Extractor & Transformation Engine
│   ├── extractors/              # Web scrapers & HTML/JSON parsers
│   ├── models/                  # SQLite schema definitions & Pydantic models
│   ├── transform/               # Match & statistics cleaning utilities
│   ├── bgmi_intel.db            # SQLite production database
│   ├── seed_media.py            # Media Hub database seeder script
│   └── run_pipeline.py          # Data pipeline execution entrypoint
├── public/                      # Static web assets & icons
├── src/                         # React Frontend Application
│   ├── components/              # UI Components (Dashboard, Tournaments, Teams, MapIntel, MediaHub, etc.)
│   ├── services/                # API Client services (api.js)
│   ├── App.jsx                  # Main Application Component & Navigation
│   ├── index.css                # Global Design Tokens & Glassmorphism Styles
│   └── main.jsx                 # Vite Entrypoint
├── server.py                    # FastAPI REST API Backend Server
├── test_qa_suite.py             # Full QA & API Test Suite
├── package.json                 # Node dependencies & scripts
├── vite.config.js               # Vite bundler configuration
└── README.md                    # Project Documentation
```

---

## 🚀 Quick Start & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Python**: v3.10 or higher
* **Git**: Installed on your system

---

### 1. Clone the Repository

```bash
git clone https://github.com/RamanKumar00/BGMI-INTEL.git
cd BGMI-INTEL
```

---

### 2. Backend Setup (FastAPI + SQLite)

1. Navigate to the project root directory.
2. (Optional) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install required Python packages:
   ```bash
   pip install fastapi uvicorn pydantic requests beautifulsoup4 pandas
   ```
4. Seed the Media Hub database with sample assets (optional):
   ```bash
   python data-pipeline/seed_media.py
   ```
5. Start the FastAPI REST server:
   ```bash
   python server.py
   ```
   The backend API will run live at `http://localhost:8000`. API documentation is available at `http://localhost:8000/docs`.

---

### 3. Frontend Setup (React + Vite)

1. Open a new terminal window in the project root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The web app will open at `http://localhost:5173`.

---

### 4. Running the QA Test Suite

To verify system integrity, API endpoints, data models, and database connections:

```bash
python test_qa_suite.py
```

Expected output: `Ran 23 tests in X.XXXs - OK (100% Passing)`.

---

## 📡 Key REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Returns overall tournament summaries, top teams, and MVP leaders |
| `GET` | `/api/tournaments` | List all tracked BGMI tournaments & stages |
| `GET` | `/api/teams` | List participating esports teams and roster statistics |
| `GET` | `/api/matches` | Get game-by-game match telemetry & results |
| `GET` | `/api/map-intel` | Get drop spots, zone heatmaps, and rotation data for maps |
| `GET` | `/api/media` | Retrieve filtered/searched BGMI Media Hub assets |
| `POST` | `/api/media` | Upload a new media asset to the Media Hub |
| `POST` | `/api/media/{id}/download` | Increment asset download counter |
| `POST` | `/api/media/{id}/like` | Increment asset like counter |

---

## 🎨 UI & Aesthetics

The platform features an **esports dark glassmorphism theme**, built using custom CSS variables, subtle micro-animations, neon accent highlights (`#00F0FF`, `#FF0055`, `#7000FF`), responsive grid systems, and high contrast typography.

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit a Pull Request or open an Issue for bug reports or feature requests.

---

## 📜 License

This project is open-source under the [MIT License](LICENSE).
