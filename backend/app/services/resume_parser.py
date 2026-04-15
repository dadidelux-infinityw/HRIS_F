"""
Resume parsing service using Gemini API
Adapted from resume_builder/src/gemini_pipeline.py
"""
import json
import logging
import re
from typing import Dict, Any, Tuple, List
from io import BytesIO

from google import genai
from google.genai import types
from pypdf import PdfReader

from app.core.config import settings

logger = logging.getLogger(__name__)

MODEL_NAME = "gemini-2.5-flash"

SYSTEM_PROMPT = """
You are an expert HR Data Analyst. Extract all information from the provided CV/resume text
into a clean, structured JSON format.

You MUST return ONLY valid JSON with the following structure (no markdown, no code blocks):
{
    "contact": {
        "name": "string or null",
        "email": "string or null",
        "phone": "string or null",
        "location": "string or null",
        "linkedin": "string or null",
        "website": "string or null"
    },
    "summary": "string or null",
    "work_experience": [
        {
            "company": "string",
            "title": "string",
            "start_date": "string",
            "end_date": "string or 'Present'",
            "responsibilities": ["string", ...]
        }
    ],
    "education": [
        {
            "institution": "string",
            "degree": "string",
            "field": "string or null",
            "start_date": "string or null",
            "end_date": "string or null"
        }
    ],
    "skills": ["string", ...],
    "certifications": [
        {
            "name": "string",
            "issuer": "string or null",
            "date": "string or null"
        }
    ],
    "languages": ["string", ...]
}

Important:
- Extract ALL skills mentioned (technical and soft skills)
- Use null for missing information, not empty strings
- Dates should be in "Month Year" format when available (e.g., "January 2020")
- Return ONLY the JSON object, no additional text or explanation
"""


class ResumeParserService:
    """Service for parsing resumes using pypdf and Gemini API"""

    def __init__(self):
        self.client = None
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """
        Extract text content from PDF binary data.

        Args:
            pdf_bytes: PDF file content as bytes

        Returns:
            Extracted text from all pages

        Raises:
            ValueError: If PDF is malformed or empty
        """
        try:
            pdf_file = BytesIO(pdf_bytes)
            reader = PdfReader(pdf_file)

            if len(reader.pages) == 0:
                raise ValueError("PDF has no pages")

            text_content = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_content += page_text + "\n"

            if not text_content.strip():
                raise ValueError("No text could be extracted from PDF")

            return text_content.strip()

        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {str(e)}")
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

    def parse_with_gemini(self, resume_text: str) -> Dict[str, Any]:
        """
        Parse resume text using Gemini API.

        Args:
            resume_text: Extracted text from resume

        Returns:
            Parsed resume data as dictionary

        Raises:
            RuntimeError: If Gemini API is not configured or fails
            ValueError: If response is not valid JSON
        """
        if not self.client:
            raise RuntimeError("Gemini API key not configured. Set GEMINI_API_KEY in .env")

        try:
            prompt = f"{SYSTEM_PROMPT}\n\nRESUME TEXT:\n{resume_text}"

            response = self.client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )

            response_text = (response.text or "").strip()
            response_text = response_text.replace('```json', '').replace('```', '').strip()

            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                # Fallback: strip trailing commas that Gemini occasionally emits
                cleaned = re.sub(r',(\s*[}\]])', r'\1', response_text)
                return json.loads(cleaned)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {str(e)}")
            raise ValueError(f"Invalid JSON response from Gemini: {str(e)}")
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise RuntimeError(f"Gemini API error: {str(e)}")

    def parse_resume(self, pdf_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
        """
        Full resume parsing pipeline: extract text and parse with Gemini.

        Args:
            pdf_bytes: PDF file content as bytes

        Returns:
            Tuple of (extracted_text, parsed_data)
        """
        # Step 1: Extract text from PDF
        extracted_text = self.extract_text_from_pdf(pdf_bytes)

        # Step 2: Parse with Gemini
        parsed_data = self.parse_with_gemini(extracted_text)

        return extracted_text, parsed_data

    def extract_skills(self, parsed_data: Dict[str, Any]) -> List[str]:
        """
        Extract skills list from parsed resume data.

        Args:
            parsed_data: Parsed resume dictionary

        Returns:
            List of skill strings (normalized/deduplicated)
        """
        skills = parsed_data.get("skills", [])

        # Normalize: strip whitespace, deduplicate (case-insensitive)
        normalized_skills = []
        seen = set()

        for skill in skills:
            if isinstance(skill, str):
                normalized = skill.strip()
                if normalized and normalized.lower() not in seen:
                    normalized_skills.append(normalized)
                    seen.add(normalized.lower())

        return normalized_skills


# Singleton instance
resume_parser_service = ResumeParserService()
