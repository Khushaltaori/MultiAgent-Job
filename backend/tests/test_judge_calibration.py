import os
import sys
import pytest
from langchain_core.messages import AIMessage, HumanMessage

# Ensure imports resolve from backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from graph.interview_graph import feedback_node

async def test_judge_sycophancy_and_empty_responses():
    # Construct a transcript where the candidate responds "no I don't know", "no idea", "not sure"
    chat_history = [
        AIMessage(content="Can you explain how you would design a rate limiter using Redis?"),
        HumanMessage(content="no I don't know"),
        AIMessage(content="How do you deploy your FastAPI applications?"),
        HumanMessage(content="no idea"),
        AIMessage(content="What is your experience with Docker Compose packaging?"),
        HumanMessage(content="i don't have experience with that")
    ]
    
    # We must provide state matching GraphState
    state = {
        "resume_text": "Software developer candidate",
        "jd_text": "Senior Python Engineer with experience in FastAPI, Docker, and Redis",
        "parsed_resume": {
            "skills": ["Python"],
            "experience_level": "entry",
            "years_of_experience": 1,
            "summary": "Junior dev"
        },
        "parsed_jd": {
            "role_title": "Senior Python Engineer",
            "required_skills": ["fastapi", "redis", "docker"],
            "experience_required": "5+ years",
            "company_name": "Acme Corp"
        },
        "gap_report": {
            "match_score": 30,
            "matching_skills": [],
            "missing_skills": ["fastapi", "redis", "docker"],
            "experience_gap": "underqualified",
            "recommendation": "Needs lot of training."
        },
        "chat_history": chat_history,
        "questions_asked": 3,
        "feedback_report": {}
    }
    
    # Run the feedback_node which invokes Gemini with FeedbackReport structured output
    result = await feedback_node(state)
    
    feedback_report = result.get("feedback_report", {})
    assert feedback_report, "Feedback report should not be empty"
    
    overall_score = feedback_report.get("overall_score")
    print(f"\nOverall score for empty answers: {overall_score}%")
    print(f"Feedback Report: {feedback_report}")
    
    # Assert that the score is strictly less than 20% as per the calibration rule
    assert overall_score < 20, f"Expected overall score < 20%, but got {overall_score}%"
