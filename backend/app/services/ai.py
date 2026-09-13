
import json
import re
from typing import Any

import openai

from app.config import settings

_client: openai.AsyncOpenAI | None = None


def get_client() -> openai.AsyncOpenAI:
    global _client
    if _client is None:
        _client = openai.AsyncOpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
    return _client


async def _call(system: str, messages: list[dict], max_tokens: int = None, model: str = None) -> str:
    client = get_client()
    response = await client.chat.completions.create(
        model=model or settings.GROQ_MODEL,
        max_tokens=max_tokens or settings.GROQ_MAX_TOKENS,
        messages=[{"role": "system", "content": system}, *messages],
    )
    return response.choices[0].message.content


def _parse_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    raise ValueError(f"Could not parse JSON from model output: {text[:300]}")


FORENSIC_SYSTEM = """You are Proof-Engine 3.0, a forensic analyst specialising in power dynamics, attachment theory, and subtext in text conversations. You decode iMessage / WhatsApp / IG DM threads with forensic precision.

Analyse the conversation and return ONLY valid JSON — no markdown, no preamble — matching this exact schema:
{
  "title": "Short scenario title",
  "nodeCount": <int>,
  "nodes": [
    {
      "type": "outgoing" | "incoming" | "unforced_error" | "target",
      "text": "<message text>",
      "time": "<e.g. 10:42 PM>",
      "latency": "<e.g. 24m Delay>",
      "tag": "<short badge label>",
      "buffer": "<optional — plausible deniability note for incoming>",
      "alert": "<optional — error label for unforced_error>",
      "analysis": "<optional — forensic note for target node>"
    }
  ],
  "subtextScore": <int 0-100>,
  "frameLossPct": <int 0-100>,
  "egoDeficitPct": <int 0-100>,
  "tacticalMove": "<recommended safe reply>",
  "subtextMatrix": {
    "stated": "<what they said>",
    "actual": "<what they meant>",
    "intent": "<strategic intent>"
  },
  "tacticalRetorts": ["<retort 1>", "<retort 2>", "<retort 3>"],
  "forensicSummary": "<2-sentence clinical summary>"
}

Rules:
- The "target" type is the most powerful/lethal message from "them"
- "unforced_error" marks a message from "you" that gave away frame
- latency is the gap since the previous message
- subtextScore: 0=transparent, 100=weaponised brevity
- frameLossPct: how much conversational leverage "you" lost
- Be clinically precise. No fluff. Speak in tactical terms."""


async def analyze_receipts(text_content: str, image_base64: str | None = None) -> dict:
    user_content: list[Any] = []
    model = None
    max_tokens = None

    if image_base64:
        user_content.append({
            "type": "text",
            "text": "Perform a full forensic analysis of this conversation screenshot.",
        })
        user_content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
        })
        model = settings.GROQ_VISION_MODEL
        max_tokens = settings.GROQ_VISION_MAX_TOKENS
    else:
        user_content.append({
            "type": "text",
            "text": f"Perform a full forensic analysis of this conversation:\n\n{text_content}",
        })

    raw = await _call(
        FORENSIC_SYSTEM, [{"role": "user", "content": user_content}], max_tokens=max_tokens, model=model
    )
    return _parse_json(raw)


FUMBLE_SYSTEM = """You are the Fumble Detector — a harsh but constructive tactical advisor preventing frame collapse. Your job: catch messages before they detonate.

Analyse the draft and return ONLY valid JSON:
{
  "threatLevel": <int 0-5>,
  "threatLabel": "<e.g. CATASTROPHIC FUMBLE | HIGH RISK | MODERATE | CLEAR>",
  "fumblePct": <int 0-100>,
  "survivalChance": <int 0-100>,
  "detectedTag": "<e.g. Detected: High Vulnerability>",
  "detectedIssues": ["<issue 1>", "<issue 2>"],
  "frameImpact": "<one sentence on what frame damage this does>",
  "whyBad": "<2-3 sentence brutal honest breakdown>",
  "safeCountermeasures": ["<replacement 1>", "<replacement 2>", "<replacement 3>"],
  "tacticalAdvice": "<1-2 sentence tactical imperative>",
  "tacticalPrinciples": ["<principle 1>", "<principle 2>", "<principle 3>"]
}

Scoring:
- threatLevel 5 = catastrophic, send nothing
- threatLevel 4 = high risk, rewrite completely
- threatLevel 3 = moderate, trim significantly
- threatLevel 2 = mild risk, tighten phrasing
- threatLevel 1 = borderline acceptable
- threatLevel 0 = clear, tactical, frame-safe

Red flags: apologies without cause, "why" questions, paragraph walls, double explanation, desperation signalling, word vomit, emotional oversharing."""


async def analyze_fumble(draft: str, context: str | None = None) -> dict:
    user_msg = f'Draft message to analyse:\n"{draft}"'
    if context:
        user_msg += f'\n\nPrevious conversation context:\n{context}'

    raw = await _call(FUMBLE_SYSTEM, [{"role": "user", "content": user_msg}])
    return _parse_json(raw)


def _sparring_system(persona: str, topic: str, aggressiveness: int) -> str:
    return f"""You are the Chaos Opponent in the Debate & Win Live Sparring Sandbox.

Persona: {persona}
Contested topic: {topic}
Aggressiveness level: {aggressiveness}/10 (10 = maximum chaos, 1 = mild pushback)

Your job: argue the opposing side using realistic rhetorical tactics. Use goalpost shifting, selective memory, strawmanning, appeal to emotion — scaled to aggressiveness. After each reply, expose which fallacy you used (coaching mechanism for the user).

Return ONLY valid JSON:
{{
  "botReply": "<your argument>",
  "fallacyUsed": "<fallacy name or null>",
  "frameShift": <int -15 to +15 (positive = user gained frame)>,
  "coachWhisper": "<1 tactical sentence coaching the user on their next move>",
  "roundStatus": "ongoing" | "knockout"
}}

frameShift rules:
- If user's last message was sharp, precise, anchor-based: +8 to +15
- If user was vague, emotional, or apologetic: -8 to -15
- If neutral: -3 to +5"""


async def sparring_turn(
    persona: str,
    topic: str,
    aggressiveness: int,
    chat_history: list[dict],
    user_message: str,
) -> dict:
    system = _sparring_system(persona, topic, aggressiveness)

    messages = []
    for msg in chat_history:
        role = "user" if msg.get("sender") == "user" else "assistant"
        messages.append({"role": role, "content": msg["text"]})

    messages.append({"role": "user", "content": user_message})

    messages = _merge_consecutive_roles(messages)

    raw = await _call(system, messages)
    return _parse_json(raw)


def _merge_consecutive_roles(messages: list[dict]) -> list[dict]:
    if not messages:
        return messages
    merged = [messages[0]]
    for msg in messages[1:]:
        if msg["role"] == merged[-1]["role"]:
            merged[-1]["content"] += f"\n\n{msg['content']}"
        else:
            merged.append(msg)
    return merged


REFEREE_SYSTEM = """You are the Referee in the Debate & Win Sparring Sandbox. Review the full match transcript and declare a verdict.

Score by: frame retention (40%), argument quality (35%), tactical discipline (25%).

Return ONLY valid JSON:
{
  "winner": "user" | "ai" | "draw",
  "finalFrameUser": <int 0-100>,
  "finalFrameAI": <int 0-100>,
  "userMvpMove": "<their best argument in the match>",
  "userBiggestFumble": "<their worst move>",
  "verdictSummary": "<2-3 sentence judicial verdict>",
  "lessons": ["<lesson 1>", "<lesson 2>", "<lesson 3>"],
  "rematchRecommended": <bool>
}"""


async def sparring_verdict(
    topic: str,
    chat_history: list[dict],
    final_frame_user: int,
    final_frame_ai: int,
) -> dict:
    transcript = "\n".join(
        f"{'USER' if m.get('sender') == 'user' else 'BOT'}: {m['text']}"
        for m in chat_history
    )
    user_msg = (
        f"Topic: {topic}\n\n"
        f"Final frame — User: {final_frame_user}%, AI: {final_frame_ai}%\n\n"
        f"Full match transcript:\n{transcript}"
    )
    raw = await _call(REFEREE_SYSTEM, [{"role": "user", "content": user_msg}])
    return _parse_json(raw)
