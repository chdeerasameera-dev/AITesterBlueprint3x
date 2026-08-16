import re
import io
from typing import Dict, Any, List, Optional


class DocumentParserService:
    """
    Parses PDF, DOCX, TXT, and Markdown requirement documents.
    Extracts title, description, structured requirements, and acceptance criteria.
    Does NOT blindly send entire document to LLM — applies deterministic extraction first.
    """

    # Keywords that indicate an acceptance criterion line
    AC_KEYWORDS = [
        "given", "when", "then", "must", "shall", "should",
        "user can", "user should", "system shall", "system must",
        "the system", "acceptance criteria", "ac:", "acceptance:",
        "criteria:", "verify", "ensure", "validate"
    ]

    # Keywords that start a new requirement section
    REQ_SECTION_KEYWORDS = [
        "requirement", "feature", "user story", "epic", "as a",
        "functional requirement", "non-functional", "use case", "scenario"
    ]

    def _extract_text_from_pdf(self, content_bytes: bytes) -> str:
        """Extract raw text from PDF bytes using pypdf."""
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content_bytes))
            pages = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages.append(text.strip())
            return "\n\n".join(pages)
        except ImportError:
            return content_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            return content_bytes.decode("utf-8", errors="ignore")

    def _extract_text_from_docx(self, content_bytes: bytes) -> str:
        """Extract raw text from DOCX bytes using python-docx."""
        try:
            from docx import Document
            doc = Document(io.BytesIO(content_bytes))
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            return "\n".join(paragraphs)
        except ImportError:
            return content_bytes.decode("utf-8", errors="ignore")
        except Exception:
            return content_bytes.decode("utf-8", errors="ignore")

    def _clean_line(self, line: str) -> str:
        """Strip bullet markers and leading numbers."""
        return re.sub(r'^[\s\-•*►▸▶●◆\d\.\)]+', '', line).strip()

    def _is_ac_line(self, line: str) -> bool:
        lower = line.lower()
        return any(kw in lower for kw in self.AC_KEYWORDS)

    def _is_heading(self, line: str) -> bool:
        """Detect markdown headings or ALL CAPS short headings."""
        return bool(re.match(r'^#{1,4}\s+', line)) or (
            len(line) < 80 and line.isupper() and len(line.split()) <= 8
        )

    def _extract_requirements(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Parse document lines into structured requirement blocks.
        Each block has: title, description, acceptance_criteria.
        """
        requirements: List[Dict[str, Any]] = []
        current_req: Optional[Dict[str, Any]] = None
        desc_buffer: List[str] = []
        ac_buffer: List[str] = []

        def flush():
            nonlocal current_req, desc_buffer, ac_buffer
            if current_req:
                current_req["description"] = " ".join(desc_buffer).strip() or current_req["title"]
                current_req["acceptance_criteria"] = [
                    self._clean_line(a) for a in ac_buffer if self._clean_line(a)
                ]
                if not current_req["acceptance_criteria"]:
                    # Auto-generate minimal ACs from description keywords
                    desc_lower = current_req["description"].lower()
                    auto_ac = []
                    if "login" in desc_lower or "authenticate" in desc_lower:
                        auto_ac.append("Given user is on login page, when valid credentials are submitted, then session is authenticated")
                        auto_ac.append("Given invalid credentials, when login is attempted, then validation error is displayed")
                    if "password" in desc_lower or "reset" in desc_lower:
                        auto_ac.append("Given registered email address, when reset is requested, then reset link is generated and sent")
                        auto_ac.append("Given expired reset link, when user opens link, then token expired error is displayed")
                    if "search" in desc_lower:
                        auto_ac.append("Given target database, when search query is executed, then matching results are rendered")
                        auto_ac.append("Given no matching query, when search runs, then empty state message is shown")
                    if not auto_ac:
                        auto_ac = [
                            f"Given valid request parameters, when system executes {current_req['title']}, then expected response is returned",
                            f"Given invalid inputs, when operation is triggered, then descriptive error message is shown",
                            f"Given unauthorized user, when action is attempted, then access denied status is enforced"
                        ]
                    current_req["acceptance_criteria"] = auto_ac
                requirements.append(current_req)
            current_req = None
            desc_buffer = []
            ac_buffer = []

        in_ac_section = False

        for line in lines:
            stripped = line.strip()
            if not stripped:
                in_ac_section = False
                continue

            lower = stripped.lower()

            # Detect explicit AC section headers
            if re.match(r'^(acceptance criteria|ac:|criteria:)', lower):
                in_ac_section = True
                continue

            # Detect a new requirement heading
            is_req_heading = (
                self._is_heading(stripped) or
                any(kw in lower for kw in self.REQ_SECTION_KEYWORDS)
            )

            if is_req_heading and len(stripped) > 5:
                flush()
                title = re.sub(r'^#{1,4}\s+', '', stripped).strip()
                current_req = {
                    "title": title[:120],
                    "description": "",
                    "acceptance_criteria": []
                }
                in_ac_section = False
                continue

            # Accumulate content
            if current_req is None:
                # Content before any heading — create a default requirement
                current_req = {"title": stripped[:80], "description": "", "acceptance_criteria": []}

            if in_ac_section or self._is_ac_line(stripped):
                ac_buffer.append(stripped)
            else:
                desc_buffer.append(stripped)

        flush()

        # If nothing structured was found, treat entire document as one requirement
        if not requirements:
            all_text = " ".join(lines)
            ac_lines = [self._clean_line(l) for l in lines if self._is_ac_line(l)]
            desc_lines = [l for l in lines if not self._is_ac_line(l)]
            requirements.append({
                "title": lines[0][:80] if lines else "Parsed Requirement",
                "description": " ".join(desc_lines[:10]),
                "acceptance_criteria": ac_lines[:10] if ac_lines else [
                    "System performs the described functionality",
                    "Invalid inputs are handled with appropriate error messages"
                ]
            })

        return requirements

    def parse(self, filename: str, content_bytes: bytes) -> Dict[str, Any]:
        """
        Main parse entry point. Returns structured document data.
        """
        lower_name = filename.lower()

        if lower_name.endswith(".pdf"):
            raw_text = self._extract_text_from_pdf(content_bytes)
        elif lower_name.endswith(".docx"):
            raw_text = self._extract_text_from_docx(content_bytes)
        else:
            raw_text = content_bytes.decode("utf-8", errors="ignore")

        # Normalize whitespace
        raw_text = re.sub(r'\r\n', '\n', raw_text)
        raw_text = re.sub(r'\n{3,}', '\n\n', raw_text)

        lines = [l for l in raw_text.split("\n") if l.strip()]

        requirements = self._extract_requirements(lines)

        # Primary requirement = first extracted
        primary = requirements[0] if requirements else {
            "title": filename,
            "description": raw_text[:500],
            "acceptance_criteria": []
        }

        return {
            "title": primary["title"],
            "description": primary["description"],
            "acceptance_criteria": primary["acceptance_criteria"],
            "all_requirements": requirements,
            "requirement_count": len(requirements),
            "raw_text": raw_text[:2000],  # truncated for safety
            "source_filename": filename,
            "char_count": len(raw_text),
            "line_count": len(lines)
        }

    # Backward compat alias
    def parse_text_content(self, filename: str, content_bytes: bytes) -> Dict[str, Any]:
        return self.parse(filename, content_bytes)


doc_parser = DocumentParserService()
