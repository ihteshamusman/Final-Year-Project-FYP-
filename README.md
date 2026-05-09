# 🎓 AlumniInsight: Agentic AI-Driven Career Trajectory & Market Gap Analyzer

[![Platform Live](https://img.shields.io/badge/Status-Live-success)](https://final-year-project-fyp.vercel.app/)
[![Backend Status](https://img.shields.io/badge/Service-Running-blue)](https://final-year-project-fyp-akgc.onrender.com)

## **📌 Business Case & Executive Summary**
In the modern economy, the "Skill Gap" between university curricula and industry requirements is a multibillion-dollar inefficiency. **AlumniInsight** is an end-to-end Business Intelligence (BI) solution that utilizes **Agentic AI, Machine Learning (ML), and Deep Learning (DL)** to transform static alumni data into a dynamic roadmap for institutional excellence.

As a **Business Analyst**, I developed this framework to move beyond traditional reporting, providing a 360-degree view of graduate success through a three-tier analytical lens.

---

## **🧠 The Multi-Tier Analytical Framework**

### **1. Descriptive Analytics: Historical Performance Baseline**
* **Methodology:** Leverages **Supabase (PostgreSQL)** to process a dataset of **4,000+ alumni records**.
* **BA Value:** Visualizes institutional "Health Metrics" including Employment Rates (currently 63.8%), Industry Distribution, and Time-to-Hire trends.
* **Perspective:** Provides the "Ground Truth" of where our graduates stand today.

### **2. Predictive Analytics: Industry Trend Forecasting**
* **Methodology:** Utilizes **Machine Learning (ML)** models to analyze historical career progression and predict future high-growth sectors for FMS graduates.
* **BA Value:** Identifies emerging industry clusters, enabling the university to proactively form corporate partnerships in high-demand fields.

### **3. Prescriptive Analytics: The Agentic AI "Bridge"**
* **Methodology:** This is the core innovation—an **Agentic AI Workflow**. 
    * **The Agent:** A Python-based agent (FastAPI) triggers **Playwright** to autonomously scrape real-time job data from LinkedIn and Indeed.
    * **Deep Learning (DL) Engine:** Uses a **Llama-3.3-70b-versatile** model (via Groq) to perform a "Skill-Delta" analysis.
* **BA Value:** Instead of just reporting a gap, the system **prescribes** specific curriculum updates (e.g., adding "Power BI" or "Cloud Logic") to maximize graduate ROI.

---

## **🛠️ System Architecture & Tech Stack**

| Layer | Component | Technical Role |
| :--- | :--- | :--- |
| **Frontend** | **Vercel** | Exec-level visualization and UI dashboard. |
| **Backend** | **Render (FastAPI)** | The "Agentic Brain" for scraping and AI orchestration. |
| **AI/DL** | **Groq (Llama 3.3)** | Large Language Model for gap analysis and prescriptions. |
| **Database** | **Supabase** | Cloud-native data warehouse for 4,000+ alumni profiles. |
| **Agent Tools** | **Playwright** | Autonomous web interaction for real-time market data extraction. |

---

## **📈 Business Impact & Strategic Insights**
* **Data-Driven Curriculum:** Reduces the academic response time to market changes from years to weeks.
* **Stakeholder ROI:** Direct evidence for donors, parents, and students of the tangible value of the degree.
* **Continuous Improvement:** A self-reinforcing "Learning Loop" where the platform continuously updates its prescriptions as the market shifts.

---

## **⚙️ Deployment & Installation**

### **Environment Variables**
To run this project locally, ensure you have a `.env` file containing:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GROQ_API_KEY`

### **Backend Startup**
```bash
pip install -r requirements.txt
uvicorn ml-service:app --host 0.0.0.0 --port 8000
