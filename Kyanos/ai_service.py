from datetime import datetime
import random
from config import DUMMY_AI_MODE, OPENAI_API_KEY

if not DUMMY_AI_MODE:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

def generate_response(role, prompt, mode="chat", personality=None, mood=None, weak_topics=None):
    """
    role: 'user'
    prompt: user input
    mode: 'chat', 'notes', 'quiz', 'flashcards'
    personality: string e.g., 'visual learner'
    mood: string
    weak_topics: list of topics to adapt
    """
    if DUMMY_AI_MODE:
        # Dummy AI output
        responses = {
            "chat": [
                f"🤖 Kyanos says: I see you asked about '{prompt}'. Here's a quick tip: Focus on core concepts.",
                f"🤖 Kyanos advice: Remember, '{prompt}' is important. Break it into smaller parts.",
                f"🤖 Kyanos suggests: For '{prompt}', review your notes and quiz yourself."
            ],
            "notes": [f"📒 Notes on {prompt}: Important points highlighted here."],
            "quiz": [f"❓ Quiz on {prompt}: Q1... Q2... Q3... Q4... Q5..."],
            "flashcards": [f"🃏 Flashcards for {prompt}: Q&A formatted here."]
        }
        return random.choice(responses.get(mode, ["🤖 Kyanos is thinking..."]))
    else:
        # OpenAI call
        today = datetime.now().strftime("%d %B %Y")
        if personality:
            system_prompt = f"You are Kyanos, a calm, {personality} study assistant. Today's date is {today}."
        else:
            system_prompt = f"You are Kyanos, a calm study assistant. Today's date is {today}."
        if weak_topics:
            system_prompt += f" Focus on user's weak topics: {', '.join(weak_topics)}."
        if mood:
            system_prompt += f" User mood today: {mood}."

        response = client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
        return response.output_text
