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
        logger.info(
            f"[{request_id[:8]}] 🤖 Making Groq API request: model={model}")

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
            logger.error(
                f"[{request_id[:8]}] 💥 Groq API error: {str(e)}", exc_info=True)
            raise Exception(f"GroqCloud API error: {str(e)}")

    def generate_questions(self, prompt, question_type, count=5):
        """Generate questions using AI"""
        request_id = getattr(g, 'request_id', 'unknown')
        logger.info(
            f"[{request_id[:8]}] 🤖 Generating questions: type={question_type}, count={count}, prompt_length={len(prompt)}")

        # Define question type specific instructions
        type_instructions = {
            'MCQ': """MULTIPLE CHOICE QUESTIONS (MCQ):
- Create questions with 4-5 well-crafted options
- Only ONE option should be correct (unless explicitly multiple correct answers)
- Make distractors plausible but clearly incorrect
- Ensure the correct answer is unambiguous
- Format: correct_answer should be a single integer (0-based index) or array [0, 2] for multiple correct answers
- Example: If options are ["Paris", "London", "Berlin", "Madrid"] and correct is "Paris", use correct_answer: 0""",

            'TRUE_FALSE': """TRUE/FALSE QUESTIONS:
- Create clear, unambiguous statements that are definitively true or false
- Avoid ambiguous or opinion-based statements
- Format: correct_answer should be boolean true or false (or string "true"/"false")
- Example: correct_answer: true or correct_answer: false""",

            'FILL_BLANK': """FILL-IN-THE-BLANK QUESTIONS:
- Create sentences with 1-3 blanks marked with [BLANK]
- Provide clear context so the answer is unambiguous
- Format: correct_answer should be an array of strings, one for each blank in order
- Example: If prompt has 2 blanks, correct_answer: ["answer1", "answer2"]
- Accept variations: provide the most common correct answer, but note acceptable alternatives if needed""",

            'DESCRIPTIVE': """DESCRIPTIVE/ESSAY QUESTIONS:
- Create open-ended questions that require detailed explanations
- Questions should test understanding, analysis, or synthesis
- Format: correct_answer should be a comprehensive sample answer (string) that demonstrates expected knowledge
- Provide a model answer that shows what a complete, correct response should include
- Example: correct_answer: "A comprehensive answer that covers key points..." """
        }

        system_prompt = f"""You are an expert educator and assessment specialist with years of experience creating high-quality educational questions.

Your task is to generate exactly {count} high-quality {question_type} questions based on the provided topic/prompt.

QUALITY STANDARDS:
1. Questions must be clear, unambiguous, and directly related to the topic
2. Test genuine understanding, not just memorization
3. Use appropriate difficulty level (assume college-level unless specified)
4. Ensure questions are factually accurate
5. Avoid trick questions or ambiguous wording
6. Make questions engaging and relevant

{type_instructions.get(question_type, '')}

CRITICAL REQUIREMENTS:
- You MUST provide a correct_answer for EVERY question (never null or empty)
- For MCQ: correct_answer must be a valid index (0-based) matching one of the options
- For TRUE_FALSE: correct_answer must be exactly true or false
- For FILL_BLANK: correct_answer must be an array with answers for ALL blanks
- For DESCRIPTIVE: correct_answer must be a comprehensive sample answer (minimum 2-3 sentences)
- Points should typically be 1, but can be 2-5 for more complex questions

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{{
    "questions": [
        {{
            "prompt": "Clear, well-written question text here",
            "options": ["option1", "option2", "option3", "option4"],  // REQUIRED for MCQ, null for others
            "correct_answer": <format depends on type - see instructions above>,  // REQUIRED - never null
            "points": 1  // Integer, typically 1-5
        }}
    ]
}}

IMPORTANT: 
- Generate exactly {count} questions
- Every question MUST have a correct_answer
- Ensure correct_answer format matches the question type exactly
- Return valid JSON only - no additional text or markdown"""

        user_prompt = f"""Generate {count} {question_type} questions about the following topic:

TOPIC: {prompt}

Please create diverse, high-quality questions that thoroughly test understanding of this topic. Ensure each question has a clear, correct answer."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            response = self._make_request(messages)

            content = response['choices'][0]['message']['content']
            result = json.loads(content)
            questions = result.get('questions', [])

            # Validate that all questions have required fields, especially correct_answer
            validated_questions = []
            for i, q in enumerate(questions):
                if not q.get('prompt'):
                    logger.warning(f"[{request_id[:8]}] ⚠️ Question {i + 1} missing prompt, skipping")
                    continue

                if q.get('correct_answer') is None:
                    logger.warning(f"[{request_id[:8]}] ⚠️ Question {i + 1} missing correct_answer, skipping")
                    continue

                # Validate MCQ has options
                if question_type == 'MCQ' and not q.get('options'):
                    logger.warning(f"[{request_id[:8]}] ⚠️ MCQ question {i + 1} missing options, skipping")
                    continue

                validated_questions.append(q)

            if len(validated_questions) < len(questions):
                logger.warning(
                    f"[{request_id[:8]}] ⚠️ Filtered out {len(questions) - len(validated_questions)} invalid question(s)")

            if not validated_questions:
                raise Exception(
                    "No valid questions were generated. All questions were missing required fields (prompt or correct_answer).")

            logger.info(
                f"[{request_id[:8]}] ✅ Generated {len(validated_questions)} valid question(s) with answers")
            return validated_questions
        except (KeyError, json.JSONDecodeError) as e:
            logger.error(
                f"[{request_id[:8]}] 💥 Failed to parse AI response: {str(e)}", exc_info=True)
            raise Exception(f"Failed to parse AI response: {str(e)}")
        except Exception as e:
            logger.error(
                f"[{request_id[:8]}] 💥 Error generating questions: {str(e)}", exc_info=True)
            raise

    def evaluate_answer(self, question_prompt, correct_answer, user_answer, rubric=None):
        """Evaluate a descriptive answer using AI"""
        request_id = getattr(g, 'request_id', 'unknown')
        logger.info(
            f"[{request_id[:8]}] 🤖 Evaluating answer: question_length={len(question_prompt)}, answer_length={len(user_answer)}")

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

            logger.info(
                f"[{request_id[:8]}] ✅ Answer evaluated: score={evaluation['score']}%, points={evaluation['points_earned']}")
            return evaluation
        except (KeyError, json.JSONDecodeError) as e:
            logger.error(
                f"[{request_id[:8]}] 💥 Failed to parse evaluation response: {str(e)}", exc_info=True)
            raise Exception(f"Failed to parse evaluation response: {str(e)}")
