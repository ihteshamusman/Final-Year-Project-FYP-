Instruction: Scrape and Map FMS Faculty Structure then Generate 3,000 Dummy Records.

Step 1: Scrape & Map
Access the URL: [https://www.iiu.edu.pk/faculties/faculty-of-management-sciences/](https://www.iiu.edu.pk/faculties/faculty-of-management-sciences/).
Identify and extract every department and academic program listed (BS, MS, and PhD levels). Update the existing system logic to accommodate this full organizational hierarchy for the whole Faculty of Management Sciences (FMS), replacing the previous narrow focus on Business Analytics and Project Management.

Step 2: Large-Scale Dummy Data Generation
Generate a SQL script compatible with Supabase (PostgreSQL) to insert 3,000 rows of dummy data into the alumni / students table. The data must be distributed across all scraped FMS programs and departments.

Data Requirements per Record:

Academic Info: Randomly assign programs (BBA, MBA, MS, PhD) and departments based on the scraped list.

Performance Metrics: Assign realistic CGPAs (2.0–4.0), internship counts (0–5), and skill proficiency scores (1–10).

Target Variables: Generate an is_employed status and salary figure that correlates with the performance metrics to ensure the "Prediction of Employability" model has logical patterns to process.

Timeline: Graduation years should range from 2015 to 2025.

Metadata: Use realistic, diverse names and unique identifiers (UUIDs).

Step 3: Output Format
Provide the raw SQL INSERT statements in batches to ensure compatibility with Supabase's SQL editor limits. Do not modify the existing UI components; only update the data source and the filtering logic to reflect the new full-faculty scope.

Key Technical Notes for your FYP:
Volume: 3,000 records is the "sweet spot" for a student project; it is enough to make your Prediction Model charts look professional and statistically significant without crashing a free-tier Supabase instance.

SQL Batches: If the AI gives you a single block of text, it might get cut off. If that happens, tell the AI: "Break the SQL insert into 3 parts of 1,000 rows each."

Data Integrity: The instruction to "correlate" data is vital—it ensures that when you demo your prediction dashboard, the AI's "Employability Score" actually moves up or down based on the dummy stats.