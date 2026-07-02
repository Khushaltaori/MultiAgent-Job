"""
Text sanitization utilities for content extracted from untrusted files.

All text that originates from user-uploaded resumes or pasted job descriptions
MUST pass through `sanitize_text()` before being stored or forwarded to an LLM.

Design goals:
  1. Strip null bytes and ASCII control characters that could corrupt storage.
  2. Cap total length so a malicious file cannot flood the context window.
  3. Normalise whitespace so the LLM receives clean, readable input.
  4. Do NOT interpret the text in any way – treat it as pure opaque data.
"""

import re
import unicodedata

# Maximum characters allowed after sanitisation.
# ~12 000 chars ≈ ~3 000 GPT-4 tokens – generous for a resume or JD.
MAX_TEXT_LENGTH = 12_000

# Characters we unconditionally strip:
#   \x00–\x08  (null through backspace)
#   \x0b–\x0c  (vertical tab, form feed)
#   \x0e–\x1f  (shift-out through unit separator)
#   \x7f       (DEL)
# We intentionally KEEP \x09 (tab), \x0a (LF), \x0d (CR).
_CONTROL_CHAR_RE = re.compile(
    r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]"
)

# Collapse runs of 3+ blank lines into a single blank line
_EXCESS_BLANK_LINES_RE = re.compile(r"\n{3,}")


def sanitize_text(raw: str, max_length: int = MAX_TEXT_LENGTH) -> str:
    """
    Sanitize extracted text before storage or LLM forwarding.

    Steps:
      1. Strip control characters (null bytes, etc.)
      2. Normalise Unicode to NFC form
      3. Collapse excess whitespace
      4. Hard-cap at `max_length` characters

    The function NEVER evaluates or interprets the content.
    """
    if not isinstance(raw, str):
        raw = str(raw)

    # 1. Strip dangerous control characters
    cleaned = _CONTROL_CHAR_RE.sub("", raw)

    # 2. Unicode NFC normalisation (handles weird encodings from PDFs)
    cleaned = unicodedata.normalize("NFC", cleaned)

    # 3. Collapse excessive blank lines
    cleaned = _EXCESS_BLANK_LINES_RE.sub("\n\n", cleaned)

    # 4. Strip leading/trailing whitespace per line
    cleaned = "\n".join(line.rstrip() for line in cleaned.splitlines())

    # 5. Hard cap – truncate with a clear marker so the LLM knows
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length] + "\n\n[...content truncated at limit...]"

    return cleaned.strip()
