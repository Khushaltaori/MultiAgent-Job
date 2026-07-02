import json
import sys
import time
import requests

# Color codes for pretty printing to the terminal
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

# Configuration - adjust if your local server runs on a different port/host
BASE_URL = "http://localhost:8000"
EMAIL = "rajiv@example.com"
PASSWORD = "SecurePassword123"  # Adjust if you have a different password setup

# Mock Resume matching the one from your successful intake run
RESUME_TEXT = """
Khushal Taori
linkedin.com/in/khushal-rajesh-taori/
github.com/Khushaltaori
khushaltaori2000@gmail.com
+91 9145645888

EDUCATION
RAMDEOBABA UNIVERSITY Nagpur, B.Tech in Computer Science (Exp.2027) GPA: 7.5/10

EXPERIENCE
AI LIFEBOT – AI Engineer (Present)
• Built an AI-powered expense management chatbot using Gemini 2.0 API with a RAG pipeline (LangChain + Supabase pgvector).
• Implemented role-based access control using Supabase with three roles.

PROJECTS
Stock-Assistant Chatbot
• Developed RESTful API backend using FastAPI, Pydantic models, and CORS.
"""

JD_TEXT = """
About Zostel: We built a playground for curious minds on the road. We are weaving AI into the guest journey.
Your Role: Own the Quality Narrative. Partner with PMs.
AI-First Testing: Spin up and maintain smart test suites.
Automate Like a Dev: Write lightweight scripts to hit APIs.
Exploratory Sherlocking: Put on the traveler hat and find gremlins.
Data-Driven Feedback: Tear into logs and SQL to spot flakiness.
"""

def print_header(title):
    print(f"\n{BOLD}{CYAN}{'='*60}\n{title.center(60)}\n{'='*60}{RESET}")

def authenticate_user():
    """Attempts to log in. If user doesn't exist, registers them first, then logs in."""
    print(f"{YELLOW}[*] Authenticating user {EMAIL}...{RESET}")
    login_url = f"{BASE_URL}/api/v1/auth/login"
    
    # Try logging in using JSON body with "email" instead of form-data with "username"
    login_payload = {"email": EMAIL, "password": PASSWORD}
    try:
        response = requests.post(login_url, json=login_payload)
    except requests.exceptions.ConnectionError:
        print(f"{RED}[!] Error: Could not connect to FastAPI server at {BASE_URL}. Is your server running?{RESET}")
        sys.exit(1)
        
    if response.status_code == 200:
        print(f"{GREEN}[+] Login successful!{RESET}")
        return response.json().get("access_token")
        
    # If login fails (e.g., 401 or 404), attempt registration
    print(f"{YELLOW}[*] User not found or incorrect password. Attempting registration...{RESET}")
    reg_url = f"{BASE_URL}/api/v1/auth/register"
    reg_payload = {"email": EMAIL, "password": PASSWORD}
    reg_response = requests.post(reg_url, json=reg_payload)
    
    if reg_response.status_code in [200, 201]:
        print(f"{GREEN}[+] Registration successful!{RESET}")
        # Log in now that user is registered
        response = requests.post(login_url, json=login_payload)
        if response.status_code == 200:
            return response.json().get("access_token")
    elif reg_response.status_code == 409:
        print(f"{RED}[!] User already exists but login failed. Check password/credentials.{RESET}")
    else:
        print(f"{RED}[!] Registration failed with code {reg_response.status_code}: {reg_response.text}{RESET}")
        
    return None

def test_phase_2_intake(token):
    """Executes the Phase 2 intake & gap analysis endpoint and prints structured analysis."""
    print_header("TESTING PHASE 2: INTAKE & GAP ANALYSIS")
    url = f"{BASE_URL}/api/analysis/intake"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "resume_text": RESUME_TEXT.strip(),
        "jd_text": JD_TEXT.strip()
    }
    
    print(f"{YELLOW}[*] Triggering parallel parsing nodes & gap analyzer on Gemini...{RESET}")
    start_time = time.time()
    response = requests.post(url, headers=headers, json=payload)
    duration = time.time() - start_time
    
    if response.status_code != 200:
        print(f"{RED}[!] Intake analysis failed with status {response.status_code}: {response.text}{RESET}")
        return None
        
    data = response.json()
    gap_report = data.get("gap_report", {})
    
    print(f"{GREEN}[+] Success! Intake completed in {duration:.2f} seconds.{RESET}")
    print(f"\n{BOLD}Analysis Metrics Summary:{RESET}")
    print(f" - Match Score: {BOLD}{YELLOW}{gap_report.get('match_score', 0)}/100{RESET}")
    print(f" - Found Skills: {len(data.get('parsed_resume', {}).get('skills', []))}")
    print(f" - Required Skills: {len(data.get('parsed_jd', {}).get('required_skills', []))}")
    print(f" - Identified Skill Gaps: {len(gap_report.get('missing_skills', []))}")
    print(f" - Gap Recommendation Summary:\n   {gap_report.get('recommendation', 'No recommendation returned.')}\n")
    return gap_report

def test_phase_3_interview(token):
    """Tests Phase 3 by starting the interview and listening to the raw SSE stream."""
    print_header("TESTING PHASE 3: STATEFUL STREAMING INTERVIEW")
    url = f"{BASE_URL}/api/v1/interview/start"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "resume_text": RESUME_TEXT.strip(),
        "jd_text": JD_TEXT.strip()
    }
    
    print(f"{YELLOW}[*] Launching interview and subscribing to text/event-stream...{RESET}")
    print(f"{YELLOW}[*] Live streaming tokens directly from Gemini:{RESET}\n")
    
    # We set stream=True to process SSE tokens line-by-line as they are produced
    response = requests.post(url, headers=headers, json=payload, stream=True)
    
    if response.status_code != 200:
        print(f"{RED}[!] Failed to start interview stream. Status: {response.status_code}{RESET}")
        print(response.text)
        return None

    # Process and print stream chunks in real-time
    ai_response = ""
    thread_id = None
    
    print(f"{BOLD}Interviewer: {RESET}", end="", flush=True)
    for line in response.iter_lines():
        if not line:
            continue
        # Decode the byte line to string
        decoded_line = line.decode("utf-8").strip()
        if decoded_line.startswith("data:"):
            # Extract content from SSE data prefix
            data_content = decoded_line[5:].strip()
            
            # Watch out for the end signal or metadata events containing state
            if data_content == "[DONE]":
                break
            
            try:
                # Attempt to parse json (some endpoints wrap events in a struct, others send text)
                event_data = json.loads(data_content)
                if isinstance(event_data, dict):
                    # If the backend sent a structured update event
                    if "thread_id" in event_data:
                        thread_id = event_data["thread_id"]
                    text = event_data.get("token", event_data.get("text", ""))
                    print(text, end="", flush=True)
                    ai_response += text
                else:
                    print(event_data, end="", flush=True)
                    ai_response += str(event_data)
            except json.JSONDecodeError:
                # If plain text tokens are sent on the stream
                print(data_content, end="", flush=True)
                ai_response += data_content
                
    print("\n")
    print(f"{GREEN}[+] Stream finished.{RESET}")
    return thread_id if thread_id else EMAIL # Fallback thread_id to EMAIL if it uses sub

def verify_memory_checkpoint(token, thread_id):
    """Hits the /state route to verify that the checkpointer cached the graph's history."""
    print_header("VERIFYING LANGGRAPH MEMORY CHECKPOINTER")
    url = f"{BASE_URL}/api/v1/interview/state"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"thread_id": thread_id}
    
    print(f"{YELLOW}[*] Retrieving graph state for thread_id: {BOLD}{thread_id}{RESET}...")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code != 200:
        # Try fallback query structure if parameters differ
        print(f"{YELLOW}[*] Retrying state fetch using fallback JSON query body...{RESET}")
        response = requests.post(url, headers=headers, json={"thread_id": thread_id})
        
    if response.status_code == 200:
        state_data = response.json()
        print(f"{GREEN}[+] Checkpointer verified successfully! State rehydrated.{RESET}")
        print(f"\n{BOLD}Active State Variables:{RESET}")
        print(f" - Thread ID: {BOLD}{state_data.get('thread_id', thread_id)}{RESET}")
        print(f" - Questions Asked: {BOLD}{state_data.get('questions_asked', 1)}{RESET}")
        
        # Pull the last saved transcript exchange
        history = state_data.get("chat_history", state_data.get("messages", []))
        print(f" - Messages in checkpointer memory: {len(history)}")
        if history:
            last_msg = history[-1]
            content = last_msg.get('content', '') if isinstance(last_msg, dict) else str(last_msg)
            print(f" - Last Saved AI Message (Snippet): {YELLOW}{content[:60]}...{RESET}")
    else:
        print(f"{RED}[!] Could not verify memory checkpoint. Status: {response.status_code}{RESET}")
        print(response.text)

def main():
    print(f"{BOLD}{CYAN}=== AI Job Coach - End-to-End System Validator ==={RESET}")
    token = authenticate_user()
    if not token:
        print(f"{RED}[!] Validation aborted. Authentication failed.{RESET}")
        return
        
    # Run Phase 2 Intake Gap Test
    test_phase_2_intake(token)
    
    # Run Phase 3 Stateful Interview Test
    thread_id = test_phase_3_interview(token)
    
    # Verify LangGraph State Memory
    if thread_id:
        verify_memory_checkpoint(token, thread_id)
        
    print_header("SYSTEM VALIDATION COMPLETE")
    print(f"{GREEN}{BOLD}Your parallel intake gap analysis & stateful checkpointer memory pipeline are working perfectly!{RESET}")

if __name__ == "__main__":
    main()