import json
import logging
from flask import current_app, g
from groq import Groq

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        self._groq_client = None
    
    @property
    def groq_client(self):
        """Lazy load Groq client from Flask config"""
        if self._groq_client is None:
            api_key = current_app.config.get('GROQ_API_KEY', '')
            self._groq_client = Groq(api_key=api_key) if api_key else None
        return self._groq_client
    
    def _make_request(self, messages, model="openai/gpt-oss-120b"):
        """Make a request to GroqCloud API using the official SDK"""
        request_id = getattr(g, 'request_id', 'unknown')
        logger.info(f"[{request_id[:8]}] 🤖 Making Groq API request: model={model}")
        
        if not self.groq_client:
            logger.error(f"[{request_id[:8]}] 💥 Groq API key not configured")
            raise Exception("GroqCloud API key not configured")
        
        try:
            logger.debug(f"[{request_id[:8]}] Sending request to Groq API")
            response = self.groq_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                response_format={"type": "json_object"},
                timeout=30.0
            )
            
            logger.info(f"[{request_id[:8]}] ✅ Groq API request successful")
            # Convert response to dict format for compatibility
            return {
                'choices': [{
                    'message': {
                        'content': response.choices[0].message.content
                    }
                }]
            }
        except Exception as e:
            logger.error(f"[{request_id[:8]}] 💥 Groq API error: {str(e)}", exc_info=True)
            raise Exception(f"GroqCloud API error: {str(e)}")
    
    def generate_questions(self, prompt, question_type, count=5):
        """Generate questions using AI"""
        request_id = getattr(g, 'request_id', 'unknown')
        logger.info(f"[{request_id[:8]}] 🤖 Generating questions: type={question_type}, count={count}, prompt_length={len(prompt)}")
        
        system_prompt = f"""You are an expert educator creating {question_type} questions.
Generate exactly {count} high-quality {question_type} questions based on the following topic/prompt.

Return a JSON object with this structure:
{{
  "questions": [
    {{
      "prompt": "question text here",
      "options": ["option1", "option2", ...],  // Only for MCQ
      "correct_answer": "correct answer",  // Format depends on question type
      "points": 1
    }}
  ]
}}

For MCQ: correct_answer should be the index (0-based) or array of indices for multiple correct answers.
For TRUE_FALSE: correct_answer should be true or false.
For FILL_BLANK: correct_answer should be an array of correct answers for each blank.
For DESCRIPTIVE: correct_answer can be a sample answer or null.

Topic/Prompt: {prompt}"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate {count} {question_type} questions about: {prompt}"}
        ]
        
        try:
            response = self._make_request(messages)
            
            content = response['choices'][0]['message']['content']
            result = json.loads(content)
            questions = result.get('questions', [])
            
            logger.info(f"[{request_id[:8]}] ✅ Generated {len(questions)} question(s) successfully")
            return questions
        except (KeyError, json.JSONDecodeError) as e:
            logger.error(f"[{request_id[:8]}] 💥 Failed to parse AI response: {str(e)}", exc_info=True)
            raise Exception(f"Failed to parse AI response: {str(e)}")
    
    def evaluate_answer(self, question_prompt, correct_answer, user_answer, rubric=None):
        """Evaluate a descriptive answer using AI"""
        request_id = getattr(g, 'request_id', 'unknown')
        logger.info(f"[{request_id[:8]}] 🤖 Evaluating answer: question_length={len(question_prompt)}, answer_length={len(user_answer)}")
        
        system_prompt = """You are an expert evaluator grading student answers.
Evaluate the student's answer against the correct answer and provide:
1. A score (0-100 as a percentage)
2. Detailed feedback
3. Points earned (based on the question's point value)

Return a JSON object:
{
  "score": 85,  // Percentage score
  "points_earned": 4.25,  // Actual points (score * question_points / 100)
  "feedback": "Detailed feedback here"
}"""
        
        user_prompt = f"""Question: {question_prompt}
Correct Answer: {correct_answer or "N/A"}
Student Answer: {user_answer}
{"Rubric: " + rubric if rubric else ""}

Evaluate the student's answer and provide scoring and feedback."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            response = self._make_request(messages)
            
            content = response['choices'][0]['message']['content']
            result = json.loads(content)
            evaluation = {
                'score': result.get('score', 0),
                'points_earned': result.get('points_earned', 0),
                'feedback': result.get('feedback', '')
            }
            
            logger.info(f"[{request_id[:8]}] ✅ Answer evaluated: score={evaluation['score']}%, points={evaluation['points_earned']}")
            return evaluation
        except (KeyError, json.JSONDecodeError) as e:
            logger.error(f"[{request_id[:8]}] 💥 Failed to parse evaluation response: {str(e)}", exc_info=True)
            raise Exception(f"Failed to parse evaluation response: {str(e)}")

