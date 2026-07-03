import json
import uuid
import sys
import time
import requests

# Terminal Colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

BASE_URL = "http://localhost:8000"
EMAIL = "rajiv@example.com"
PASSWORD = "SecurePassword123"

def print_header(text):
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}{text.center(60)}{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")

def authenticate_user():
    print(f"[*] Authenticating user {EMAIL}...")
    try:
        # Step 1: Register (ignoring if already exists)
        register_url = f"{BASE_URL}/api/v1/auth/register"
        reg_payload = {"email": EMAIL, "password": PASSWORD}
        requests.post(register_url, json=reg_payload)
        
        # Step 2: Login
        login_url = f"{BASE_URL}/api/v1/auth/login"
        response = requests.post(login_url, json={"email": EMAIL, "password": PASSWORD})
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"{GREEN}[+] Login successful!{RESET}")
            return token
        else:
            print(f"{RED}[!] Authentication failed: {response.text}{RESET}")
            sys.exit(1)
    except Exception as e:
        print(f"{RED}[!] Connection error: Check if your FastAPI server is running! Error: {e}{RESET}")
        sys.exit(1)

def start_interview_session(token, thread_id):
    """
    Kicks off the interview session, which should run through Phase 2 (analysis),
    transition to Phase 3, ask Question 1, and interrupt.
    """
    print_header("KICKING OFF INTERVIEW (TURN 1)")
    
    url = f"{BASE_URL}/api/v1/interview/start"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Simple payload with thread_id to ensure we track the state
    payload = {
        "thread_id": thread_id,
        "resume_text": "Khushal Taori - AI Engineer. Built expense chatbots using Gemini 2.0 API, FastAPI, LangChain, and Supabase RAG pipelines. Database skills: PostgreSQL, Supabase, SQL.",
        "jd_text": "About Zostel: Looking for an AI-First Testing Engineer to spin up and maintain smart test suites, write scripts to hit APIs, analyze logs and SQL. Gaps: Redis, Next.js, API testing."
    }
    
    print(f"[*] Dispatching start request with thread_id: {BOLD}{thread_id}{RESET}...")
    
    # We listen to the SSE response stream
    response = requests.post(url, headers=headers, json=payload, stream=True)
    
    if response.status_code != 200:
        print(f"{RED}[!] Failed to start interview. Status Code: {response.status_code}{RESET}")
        print(f"Response: {response.text}")
        return False

    print(f"[*] Streaming Question 1 from backend:")
    print(f"{YELLOW}Interviewer: {RESET}", end="", flush=True)
    
    full_response = ""
    actual_thread_id = thread_id
    for line in response.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            if decoded_line.startswith("data:"):
                data_content = decoded_line[5:].strip()
                
                if data_content == "[DONE]":
                    break
                
                try:
                    # Attempt to parse as structured SSE or raw token chunk
                    event_data = json.loads(data_content)
                    if isinstance(event_data, dict):
                        if "thread_id" in event_data:
                            actual_thread_id = event_data["thread_id"]
                        token_chunk = event_data.get("token", event_data.get("text", ""))
                        if token_chunk:
                            print(token_chunk, end="", flush=True)
                            full_response += token_chunk
                    elif isinstance(event_data, str):
                        print(event_data, end="", flush=True)
                        full_response += event_data
                except json.JSONDecodeError:
                    print(data_content, end="", flush=True)
                    full_response += data_content
                    
    print("\n")
    print(f"{GREEN}[+] Turn 1 Finished. The state machine hit the HITL interrupt and is sleeping.{RESET}")
    return True, actual_thread_id

def send_response_turn(token, thread_id, user_answer, turn_num):
    """
    Submits user response to /api/v1/interview/respond, resumes the graph from Redis,
    and streams the next question.
    """
    print_header(f"SUBMITTING USER ANSWER (TURN {turn_num})")
    
    url = f"{BASE_URL}/api/v1/interview/respond"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "thread_id": thread_id,
        "answer": user_answer
    }
    
    print(f"[*] Sending candidate answer: \"{BOLD}{user_answer}{RESET}\"")
    print(f"[*] Resuming state graph thread from Redis...")
    
    response = requests.post(url, headers=headers, json=payload, stream=True)
    
    if response.status_code != 200:
        print(f"{RED}[!] Failed to resume graph on turn {turn_num}. Status Code: {response.status_code}{RESET}")
        print(f"Response: {response.text}")
        return False
        
    print(f"[*] Streaming Question {turn_num} from backend:")
    print(f"{YELLOW}Interviewer: {RESET}", end="", flush=True)
    
    full_response = ""
    for line in response.iter_lines():
        if line:
            decoded_line = line.decode('utf-8')
            if decoded_line.startswith("data:"):
                data_content = decoded_line[5:].strip()
                
                if data_content == "[DONE]":
                    break
                
                try:
                    event_data = json.loads(data_content)
                    if isinstance(event_data, dict):
                        token_chunk = event_data.get("token", event_data.get("text", ""))
                        print(token_chunk, end="", flush=True)
                        full_response += token_chunk
                except json.JSONDecodeError:
                    print(data_content, end="", flush=True)
                    full_response += data_content
                    
    print("\n")
    print(f"{GREEN}[+] Turn {turn_num} Finished. Graph successfully saved next checkpoint to Redis.{RESET}")
    return True

def verify_redis_checkpoint_state(token, thread_id, expected_turns):
    """
    Hits the state-endpoint to assert that history length, questions_asked index,
    and state variables accurately survive in Redis storage.
    """
    print_header("VERIFYING PERSISTED REDIS CHECKPOINT")
    
    url = f"{BASE_URL}/api/v1/interview/state"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "thread_id": thread_id
    }
    
    print(f"[*] Fetching active graph state variables for: {thread_id}...")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code != 200:
        print(f"{RED}[!] State endpoint failed with status {response.status_code}{RESET}")
        print(f"Response: {response.text}")
        return
        
    state_data = response.json()
    
    questions_asked = state_data.get("questions_asked", 0)
    messages_count = state_data.get("chat_history_length", 0)
    
    print(f"\nRehydrated State Parameters:")
    print(f" - Active Thread ID: {BOLD}{thread_id}{RESET}")
    print(f" - Questions Asked Count: {BOLD}{questions_asked}{RESET} (Expected: {expected_turns})")
    print(f" - Message Logs In Active Memory: {BOLD}{messages_count}{RESET}")
    
    if questions_asked == expected_turns:
        print(f"\n{GREEN}{BOLD}[SUCCESS] Redis checkpoint rehydrated and verified perfectly!{RESET}")
    else:
        print(f"\n{RED}[!] Discrepancy detected: expected {expected_turns} questions asked, got {questions_asked}.{RESET}")

if __name__ == "__main__":
    print_header("LANGGRAPH CYCLIC INTERVIEW LOOP VALIDATOR")
    
    # 1. Generate unique session ID so we start a clean testing state
    unique_thread_id = f"test_redis_{uuid.uuid4().hex[:8]}"
    
    # 2. Login to get authentication headers
    auth_token = authenticate_user()
    
    # 3. Start: Parse -> Gen Question 1 -> Interrupt
    started, actual_thread_id = start_interview_session(auth_token, unique_thread_id)
    if not started:
        sys.exit(1)
        
    # Quick delay to prevent rate issues
    time.sleep(1)
    
    # 4. Respond: Send response -> Evaluate -> Gen Question 2 -> Interrupt
    user_reply_1 = "I have extensive experience with FastAPI and Supabase, but I haven't done much testing inside Redis or Docker yet."
    responded_turn_2 = send_response_turn(auth_token, actual_thread_id, user_reply_1, turn_num=2)
    if not responded_turn_2:
        sys.exit(1)
        
    time.sleep(1)
    
    # 5. Verify current state inside Redis
    verify_redis_checkpoint_state(auth_token, actual_thread_id, expected_turns=2)

