import pandas as pd
import urllib.request
import urllib.error
import json
import datetime
import sys

# Database config
SUPABASE_URL = "https://anxoxtavdydntwhavgdh.supabase.co/rest/v1"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueG94dGF2ZHlkbnR3aGF2Z2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDQxNzcsImV4cCI6MjA5MzgyMDE3N30.gO17m6YHaK52iN8QaE7kte0jW9-87hKVdaB5b66nssE"

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def make_request(url_path, method="GET", payload=None):
    url = f"{SUPABASE_URL}/{url_path}"
    data = None
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
        
    req = urllib.request.Request(url, headers=headers, method=method, data=data)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            if res_body:
                return json.loads(res_body)
            return True
    except urllib.error.HTTPError as e:
        print(f"HTTP Error for {url_path} ({method}): {e.code} - {e.reason}")
        print(e.read().decode('utf-8'))
        return None
    except Exception as e:
        print(f"Exception for {url_path} ({method}): {e}")
        return None

# Load Excel data
excel_path = r"c:\Users\ihtes\OneDrive\Desktop\FYP_Files\Alumni Data 2013.xlsx"
try:
    df = pd.read_excel(excel_path, skiprows=1)
    df.columns = [c.strip() for c in df.columns]
    print(f"Loaded Excel file successfully. {len(df)} rows.")
except Exception as e:
    print(f"Error loading Excel: {e}")
    sys.exit(1)

# Step 1: Clear current alumni table
print("Clearing alumni table...")
make_request("alumni?student_id=not.is.null", method="DELETE")

# Step 2: Prepare and insert alumni records
alumni_list = []
seen_emails = set()

# Use idx to generate unique ID since S/N column contains duplicates
for idx, row in df.iterrows():
    sn = row['S/N']
    name = str(row['Name']).strip()
    desig = str(row['Designation']).strip()
    c_name = str(row['Company']).strip()
    loc = str(row['Location']).strip()
    email = str(row['Email']).strip()
    mobile = str(row['Mobile']).strip()
    status = str(row['Status']).strip()
    
    if not name or name == 'nan' or name == 'None':
        continue
        
    # Generate clean email if missing
    if not email or email == '-' or email == 'nan':
        clean_name = "".join([c for c in name.lower() if c.isalnum()])
        email = f"{clean_name}.{sn}@alumni.com"
    
    # Resolve duplicate emails
    if email.lower() in seen_emails:
        if '@' in email:
            local, domain = email.split('@', 1)
            email = f"{local}_{sn}@{domain}"
        else:
            email = f"{email}_{sn}"
            
    seen_emails.add(email.lower())
        
    # Clean mobile phone
    if not mobile or mobile == '-' or mobile == 'nan':
        mobile = None
        
    # Clean location
    if not loc or loc == '-' or loc == 'nan' or loc == 'None':
        loc = None
        
    # Clean company
    if not c_name or c_name == '-' or c_name == 'nan' or c_name == 'None':
        c_name = None

    # Determine graduation year, program, and degree level from Status column
    grad_year = 2013
    enroll_year = 2009
    program = None
    degree_level = 'BS'
    
    status_lower = status.lower()
    if 'passout' in status_lower:
        # try to extract year
        for word in status.split():
            clean_word = "".join([c for c in word if c.isdigit()])
            if len(clean_word) == 4:
                grad_year = int(clean_word)
                enroll_year = grad_year - 4
    elif '1999-2004' in status_lower:
        grad_year = 2004
        enroll_year = 1999
    elif '2004' in status_lower:
        grad_year = 2004
        enroll_year = 2000
        
    if 'bba' in status_lower:
        program = 'Business Admin'
        degree_level = 'BS'
    elif 'mba' in status_lower:
        program = 'Business Admin'
        degree_level = 'MS'
    elif 'ms' in status_lower:
        program = 'Project Management'
        degree_level = 'MS'
        
    # Determine employment status
    is_employed = False
    if desig and desig != '-' and desig != 'nan':
        is_employed = True
    elif c_name and c_name != '-' and c_name != 'nan':
        is_employed = True
        
    emp_status = 'Employed' if is_employed else 'Seeking Employment'
    
    # Clean job title
    job_title = desig if (desig and desig != '-' and desig != 'nan') else None
    
    # Generate unique student_id using the row index (idx) to ensure global uniqueness
    student_id = f"{grad_year}-FMS-{degree_level}-{1001 + idx}"
    
    alumni_record = {
        "student_id": student_id,
        "full_name": name,
        "email": email,
        "phone": mobile,
        "program": program,
        "degree_level": degree_level,
        "enrollment_year": enroll_year,
        "graduation_year": grad_year,
        "graduation_status": "Graduated",
        "cgpa": None,
        "semester_wise_gpa": None,
        "thesis_title": None,
        "technical_skills": None,
        "soft_skills": None,
        "certifications": None,
        "internship_experience": None,
        "projects_completed": None,
        "tools_proficiency": None,
        "employment_status": emp_status,
        "company_id": None,
        "company_name": c_name,  # Added new company_name field
        "location": loc,          # Added new location field
        "job_title": job_title,
        "job_level": None,
        "monthly_salary_range": None,
        "time_to_first_job": None,
        "is_job_relevant": None,
        "linkedin_url": None,
        "created_at": datetime.datetime.utcnow().isoformat() + "Z"
    }
    alumni_list.append(alumni_record)

print(f"Prepared {len(alumni_list)} alumni records. Inserting into alumni table...")

# Batch insert in chunks of 50
chunk_size = 50
inserted_count = 0
for i in range(0, len(alumni_list), chunk_size):
    chunk = alumni_list[i:i+chunk_size]
    res = make_request("alumni", method="POST", payload=chunk)
    if res is not None:
        inserted_count += len(chunk)
        print(f"Inserted records {i+1} to {min(i+chunk_size, len(alumni_list))}...")
    else:
        print(f"Failed to insert records {i+1} to {min(i+chunk_size, len(alumni_list))}")

print(f"Alumni migration completed! Successfully inserted {inserted_count} out of {len(alumni_list)} records.")
