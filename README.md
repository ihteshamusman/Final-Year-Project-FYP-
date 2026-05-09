# 🎓 AlumniInsight: AI-Driven Career Trajectory Analyzer

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://final-year-project-fyp.vercel.app/)
[![Backend Status](https://img.shields.io/badge/backend-Render-blue)](https://final-year-project-fyp-akgc.onrender.com)
[![Tech Stack](https://img.shields.io/badge/stack-FastAPI%20|%20Vercel%20|%20Supabase-orange)]()

**AlumniInsight** is a Full-Stack Prescriptive Analytics platform designed to track alumni success and provide real-time curriculum recommendations by analyzing current job market trends.

## 🚀 Live Links
- **Frontend Dashboard:** [https://final-year-project-fyp.vercel.app/](https://final-year-project-fyp.vercel.app/)
- **API Status:** [Service Health Check](https://final-year-project-fyp-akgc.onrender.com)

---

## 💡 Key Features
- **Real-Time Job Scraper:** Automates the collection of job requirements from LinkedIn and Indeed using Playwright and Python.
- **AI-Powered Gap Analysis:** Utilizes the **Llama-3.3-70b-versatile** model via Groq to compare 4,000+ alumni records with live market demands.
- **Prescriptive Analytics:** Generates actionable advice for curriculum updates based on identified skill shortages.
- **Dynamic Dashboard:** Visualizes employment rates, average time-to-hire, and top hiring industries.

## 🛠️ Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Vercel |
| **Backend** | Python, FastAPI, Render |
| **Database** | Supabase (PostgreSQL) |
| **AI / ML** | Groq (Llama 3.3 70B), Playwright (Scraping) |
| **Tools** | Git/GitHub, Pip |

---

## 🏗️ System Architecture
The project follows a **Decoupled Architecture**:
1. **The Client (Vercel):** A responsive UI that fetches data from Supabase and triggers AI analysis.
2. **The Intelligence Service (Render):** A FastAPI backend that handles heavy scraping tasks and LLM orchestration.
3. **The Data Layer (Supabase):** Stores 4,000+ alumni profiles, employment history, and analytics metrics.



---

## ⚙️ Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/final-year-project-fyp.git](https://github.com/your-username/final-year-project-fyp.git)
