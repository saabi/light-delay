#!/usr/bin/env python3
"""Build multi-speaker TTS outlines from master narrative Markdown exports.

Speakers for dialogue come ONLY from attributed blockquotes
(`> **Name:** …`) which mirror `speakerId` in the master JSON — never from
heuristic quote matching (that caused prior errors).

Usage:
  python scripts/build-tts-voices-outlines.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WIP = ROOT / "docs" / "wip"

EN_SRC = WIP / "general-narrative-outline.en.md"
ES_SRC = WIP / "general-narrative-outline.es.md"
AUDIENCE_PERFORMANCE_SRC = (
    ROOT / "data" / "production" / "audio" / "audience-dialogue-performance.json"
)
AUDIENCE_NARRATIVES_SRC = (
    ROOT / "data" / "production" / "audio" / "audience-narratives.json"
)
MASTER_OUTLINE_SRC = ROOT / "data" / "outlines" / "light-delay-master-narrative.json"
VOICE_PROFILES_SRC = ROOT / "data" / "voice-profiles.json"

CHARACTER_ID_BY_SPEAKER = {
    "Zao": "character:zao",
    "Voss": "character:voss",
    "Harlan": "character:harlan",
    "Elin": "character:rao",
    "Sorell": "character:sorell",
    "Okoye": "character:okoye",
    "Cael": "character:cael",
}

# Performance directs keyed by EN quote (normalized). Spanish file uses the same
# keys after normalizing guillemets to the EN surface for lookup when possible;
# otherwise a Spanish-specific map entry.
INSTRUCT_EN: dict[str, str] = {
    "we know what the mouth told us. that isn't the same as knowing who told it to speak.": (
        "Quiet, controlled dread. Slow, even cadence. Philosophical rather than angry; a man stating a hard truth he has already accepted."
    ),
    "i wish they were right.": (
        "Soft, bitter understatement. Low volume. Looking at hopeful people he does not believe; regret without self-pity."
    ),
    "they built a door in our system before we knew they existed. now the door tells us when to walk through.": (
        "Measured political fear. Clear officer diction. Rising pressure on the second sentence; do not shout."
    ),
    "we studied everything they gave us before we agreed to send a single ship out there. that isn't fear. it's respect.": (
        "Warm but firm. Defending rigor as respect, not panic. Precise diction; slight French-English musicality without caricature."
    ),
    "he wasn't hoping.": (
        "Dry, flat correction. Quiet certainty. Almost no emotion on the surface; a sharp observational cut."
    ),
    "that wasn't hope.": (
        "Dry, flat correction. Quiet certainty. Almost no emotion on the surface; a sharp observational cut."
    ),
    "you find faults for a living. that doesn't make everyone a fault.": (
        "Calm command rebuke. Steady baritone authority. Mild warmth; not scolding."
    ),
    "if zao says we're on time, we're on time.": (
        "Familiar trust. Light confidence. Easy, almost casual, still in command register."
    ),
    "the outbound throat closes behind us. until the return window, there's no turning around.": (
        "Solemn operational fact. Clear, unhurried. Let the irreversibility land without drama."
    ),
    "they think the mission looks too aggressive.": (
        "Observational, slightly wry. Clear security-officer diction; reporting what she sees on the feed, not joking."
    ),
    "we're making first contact in a ninety-metre phallus called celestial ardor.": (
        "Deadpan dry humor. Flat delivery; no laugh. Technical woman stating an absurd fact plainly."
    ),
    "i didn't name it.": (
        "Dry clipped amusement. Short, underplayed. Deadpan follow-through after her own joke."
    ),
    "let's make the greeting less ambiguous.": (
        "Professional focus. Constructive, slightly urgent, still collegial."
    ),
    "how do you say hello to something you've never heard answer?": (
        "Genuine curious wonder. Softened edges; thoughtful, not joking."
    ),
    "they wrote the primer. we haven't spoken back.": (
        "Thoughtful unease. Quiet realization; weight on the second sentence."
    ),
    "when the mouth goes quiet, that isn't nothing. silence is still a choice.": (
        "Quiet pedagogical weight. Soft certainty; let the second sentence land as principle, not flourish."
    ),
    "when the mouth goes quiet, it is still saying something. silence is still a choice.": (
        "Quiet pedagogical weight. Soft certainty; let the second sentence land as principle, not flourish."
    ),
    "and if the ai learned it wrong?": (
        "Careful technical worry. Controlled; a real risk stated without panic."
    ),
    "and if the artificial intelligence learned it wrong?": (
        "Careful technical worry. Controlled; a real risk stated without panic."
    ),
    "misreading is possible. the ai can arrange the patterns, but it cannot convert uncertainty into knowledge.": (
        "Uncomfortable honesty. Measured admission of limits; no apology, no lecture."
    ),
    "misreading is possible. the ai can arrange the patterns, but it cannot turn uncertainty into knowledge.": (
        "Uncomfortable honesty. Measured admission of limits; no apology, no lecture."
    ),
    "se puede interpretar mal. la ia puede ordenar los patrones, pero no puede convertir la incertidumbre en conocimiento.": (
        "Uncomfortable honesty. Measured admission of limits; no apology, no lecture."
    ),
    "and what if we're the ones being read wrong?": (
        "Ominous foreshadowing. Soft, even, unsettling. Do not overact."
    ),
    "i have found a grave attempt to sabotage the mission—": (
        "Urgent wireless report cut mid-sentence. Clear engineer diction; rising alarm; trail off abruptly as if the channel dies."
    ),
    "i've found a grave attempt to sabotage the mission—": (
        "Urgent wireless report cut mid-sentence. Clear engineer diction; rising alarm; trail off abruptly as if the channel dies."
    ),
    "just in case: goodbye. harlan's at the door.": (
        "Compressed farewell under lethal pressure. Fast but clear; fear barely breaking dry control; urgency without screaming."
    ),
    "who did you send that to?": (
        "Confrontation. Controlled threat. Close, hard consonants; low and dangerous."
    ),
    "proxima is behind jupiter. earth will not know until we are already there.": (
        "Cold inferential certainty. Quiet, measured; reasoning aloud under time pressure, not defiance."
    ),
    "proxima's behind jupiter. earth won't know until we're already there.": (
        "Cold inferential certainty. Quiet, measured; reasoning aloud under time pressure, not defiance."
    ),
    "proxima está detrás de júpiter. la tierra no se enterará hasta que ya estemos allí": (
        "Cold inferential certainty. Quiet, measured; reasoning aloud under time pressure, not defiance."
    ),
    "proxima está detrás de júpiter. la tierra no se enterará hasta que ya estemos allí.": (
        "Cold inferential certainty. Quiet, measured; reasoning aloud under time pressure, not defiance."
    ),
    "how could you? why?": (
        "Performative shock and accusation for an audience. Hard, clear; manufactured moral outrage, not genuine grief."
    ),
    "before launch she asked me what it would take to delay the crossing. i thought it was professional caution.": (
        "Smooth plausible lie. Calm, earnest, almost gentle. No tell of guilt in the surface tone."
    ),
    "you're treating the first explanation as if it were the only one. that's exactly what i warned you not to do out there.": (
        "Sharp intellectual challenge. Firm, not shrill; refusing a closed story from custody."
    ),
    "lose helium-three and the mix goes deuterium-rich. more side-reaction neutrons, more fuel to hold thrust. keep bleeding it and we miss the window.": (
        "Clinical technical persuasion. Even, explanatory, authoritative; selling a false theory as physics."
    ),
    "she was trying to finish the report she started—to earth. the guidance trunk was down, so she entered the aim manually. she missed.": (
        "False explanation delivered earnestly. Soft certainty; protective storytelling that is a lie."
    ),
    "she was trying to finish the report she started - to earth. the guidance trunk was down, so she entered the aim manually. she missed.": (
        "False explanation delivered earnestly. Soft certainty; protective storytelling that is a lie."
    ),
    "zao didn't miss.": (
        "Flat absolute refusal. Quiet steel; no hesitation."
    ),
    "she was frightened. she knew someone was coming.": (
        "Soft false empathy. Gentle, almost kind; still a manipulation."
    ),
    "now they'll never know who saved them.": (
        "Bitter self-mythology. Quiet, wounded pride; not a roar."
    ),
    "you don't know what they are. you don't get to answer for earth.": (
        "Desperate accusation and plea. Hard, clear; he believes he is defending Earth, not confessing."
    ),
    "if they think we're harmless, they come closer. if they see a species that bites, maybe they wait. we needed time.": (
        "Pleading justification. Desperate logic, not a boast; voice cracking toward the end."
    ),
    "it isn't disarmed. it just isn't going off here.": (
        "Precise engineer calm under fire. Flat clarity; make the limit explicit without triumph."
    ),
    "they wrote the primer. this is the first time they'll hear us read it back.": (
        "Ceremonial resolve. Focused, hushed intensity; first-contact weight."
    ),
    "i'm sorry.": (
        "Heavy quiet apology. Slow; more than the detention — personal failure landing softly."
    ),
    "they're sending someone.": (
        "Awe and hush. Soft wonder after silence; share the news without celebrating."
    ),
    "you made it in time.": (
        "Soft grief tribute. Intimate, broken warmth; speaking to a photograph and a dead engineer."
    ),
}

NATO = {
    "A": "Alpha",
    "B": "Bravo",
    "C": "Charlie",
    "D": "Delta",
    "E": "Echo",
    "F": "Foxtrot",
    "G": "Golf",
    "P": "Papa",
}

NATO_ES = {
    "A": "Alfa",
    "B": "Bravo",
    "C": "Charlie",
    "D": "Delta",
    "E": "Eco",
    "F": "Foxtrot",
    "G": "Golf",
    "P": "Papá",
}

ONES = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
]
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]


def number_words(n: int) -> str:
    if n < 20:
        return ONES[n]
    if n < 100:
        t, o = divmod(n, 10)
        return TENS[t] if o == 0 else f"{TENS[t]} {ONES[o]}"
    if n < 1000:
        h, r = divmod(n, 100)
        return f"{ONES[h]} hundred" if r == 0 else f"{ONES[h]} hundred {number_words(r)}"
    if n < 1_000_000:
        th, r = divmod(n, 1000)
        head = number_words(th) + " thousand"
        return head if r == 0 else f"{head} {number_words(r)}"
    return str(n)


def decimal_words(s: str) -> str:
    s = s.replace(",", "")
    if "." not in s:
        return number_words(int(s))
    a, b = s.split(".", 1)
    return f"{number_words(int(a))} point {' '.join(ONES[int(d)] for d in b)}"


def norm_quote(q: str) -> str:
    q = q.strip()
    q = q.strip("«»\"“”")
    q = q.replace("«", "").replace("»", "")
    q = q.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    q = q.replace("—", "—").replace("–", "-")
    q = re.sub(r"\s+", " ", q).strip().lower()
    q = re.sub(r"[.]+$", ".", q)
    return q


def speaker_from_label(label: str) -> str:
    label = label.strip().rstrip(":")
    # Drop honorifics / full names → short TTS tag
    mapping = [
        ("Dara Okoye", "Okoye"),
        ("Okoye", "Okoye"),
        ("Elin Rao", "Elin"),
        ("Rao", "Elin"),
        ("Elin", "Elin"),
        ("Lian Sorell", "Sorell"),
        ("Sorell", "Sorell"),
        ("Rylen Harlan", "Harlan"),
        ("Harlan", "Harlan"),
        ("Elias Voss", "Voss"),
        ("Voss", "Voss"),
        ("Zao", "Zao"),
        ("Cael", "Cael"),
    ]
    for needle, short in mapping:
        if needle.lower() in label.lower():
            return short
    raise ValueError(f"Unrecognized dialogue speaker label: {label!r}")


def load_pronunciation_maps() -> dict[str, dict[str, str]]:
    """Collect canonical-to-spoken forms for each target language."""
    data = json.loads(VOICE_PROFILES_SRC.read_text(encoding="utf-8"))
    maps: dict[str, dict[str, str]] = {"es": {}, "en": {}}
    for profile in data.get("voiceProfiles", []):
        for variant in profile.get("variants", []):
            lang = variant.get("language")
            if lang not in maps:
                continue
            for written, spoken in variant.get("pronunciationMap", {}).items():
                existing = maps[lang].get(written)
                if existing is not None and existing != spoken:
                    raise ValueError(
                        f"Conflicting {lang} pronunciation for {written!r}: "
                        f"{existing!r} / {spoken!r}"
                    )
                maps[lang][written] = spoken
    return maps


PRONUNCIATION_MAPS = load_pronunciation_maps()


def apply_pronunciations(text: str, *, lang: str) -> str:
    """Return TTS-only spelling without changing canonical editorial copy."""
    result = text
    for written, spoken in sorted(
        PRONUNCIATION_MAPS.get(lang, {}).items(), key=lambda item: len(item[0]), reverse=True
    ):
        result = re.sub(
            rf"(?<!\w){re.escape(written)}(?!\w)",
            lambda _match, replacement=spoken: replacement,
            result,
        )
    return result


def expand_en_speakables(text: str) -> str:
    t = text
    t = re.sub(r"\b(\d+)\s*[Hh]\s+(\d+)\s*[Mm][Ii]?[Nn]\b", lambda m: f"{number_words(int(m.group(1)))} hours {number_words(int(m.group(2)))} minutes", t)
    t = re.sub(r"\b(\d+)\s*[–—−-]\s*(\d+)\s*minutes\b", lambda m: f"{number_words(int(m.group(1)))} to {number_words(int(m.group(2)))} minutes", t)
    t = re.sub(r"\b(\d+(?:\.\d+)?)\s*million\s*km\b", lambda m: f"{decimal_words(m.group(1))} million kilometers", t, flags=re.I)
    t = re.sub(r"\b(\d+(?:\.\d+)?)\s*AU\b", lambda m: f"{decimal_words(m.group(1))} astronomical units", t)
    t = re.sub(r"\b(\d+)\s*hours?\b", lambda m: f"{number_words(int(m.group(1)))} hours", t, flags=re.I)
    t = re.sub(r"\bL([12])\b", lambda m: f"L {'one' if m.group(1)=='1' else 'two'}", t)
    t = re.sub(r"\bhelium-3\b", "helium three", t, flags=re.I)
    t = re.sub(r"\bHe-3\b", "helium three", t)
    t = re.sub(r"\bAI\b", "artificial intelligence", t)
    # Sequence letters in headings already handled
    return t


def speak_heading(title: str, *, lang: str) -> str:
    """Turn '### A3c — Curious…' into spoken form."""
    t = title.strip()
    t = re.sub(r"^#+\s*", "", t)
    # Sequence X —
    m = re.match(r"^(?:Sequence|Secuencia)\s+([A-GP])\b(.*)$", t, flags=re.I)
    if m:
        letter = m.group(1).upper()
        rest = m.group(2)
        code = (NATO_ES if lang == "es" else NATO).get(letter, letter)
        word = "Secuencia" if lang == "es" else "Sequence"
        return f"{word} {code}{rest}"
    m = re.match(r"^([A-GP])(\d+)([a-z]?)\s*[—–-]\s*(.+)$", t)
    if m:
        letter, num, suf, rest = m.group(1).upper(), m.group(2), m.group(3), m.group(4)
        code = (NATO_ES if lang == "es" else NATO).get(letter, letter)
        word = "Secuencia" if lang == "es" else "Sequence"
        suf_s = f" {speak_letter(suf, lang)}" if suf else ""
        return f"{word} {code} {number_words(int(num)) if lang=='en' else num}{suf_s}. {rest}"
    m = re.match(r"^P(\d+)\s*[—–-]\s*(.+)$", t)
    if m:
        word = "Secuencia" if lang == "es" else "Sequence"
        code = "Papá" if lang == "es" else "Papa"
        return f"{word} {code} {number_words(int(m.group(1))) if lang=='en' else m.group(1)}. {m.group(2)}"
    return t


def speak_letter(letter: str, lang: str) -> str:
    table = NATO_ES if lang == "es" else NATO
    return table.get(letter.upper(), letter.upper())


ATTR_RE = re.compile(
    r"^>\s*\*\*([^*]+):\*\*\s*[«“\"](.+?)[»”\"]\s*\.?$",
    re.S,
)


def parse_blocks(md: str) -> list[tuple[str, str, str | None]]:
    """Return Markdown blocks and the stable ID attached to each dialogue."""
    lines = md.splitlines()
    blocks: list[tuple[str, str, str | None]] = []
    buf: list[str] = []
    mode = None  # para | dialogue | list
    pending_dialogue_id: str | None = None

    def flush():
        nonlocal buf, mode, pending_dialogue_id
        if not buf:
            mode = None
            return
        text = "\n".join(buf).strip()
        buf = []
        if mode == "dialogue":
            blocks.append(("dialogue", text, pending_dialogue_id))
            pending_dialogue_id = None
        elif mode == "list":
            blocks.append(("list", text, None))
        else:
            blocks.append(("para", text, None))
        mode = None

    for ln in lines:
        if not ln.strip():
            flush()
            continue
        if ln.startswith("#"):
            if pending_dialogue_id is not None:
                raise ValueError(
                    f"Dialogue ID {pending_dialogue_id!r} is not followed by dialogue"
                )
            flush()
            blocks.append(("heading", ln.strip(), None))
            continue
        if ln.strip() == "---":
            if pending_dialogue_id is not None:
                raise ValueError(
                    f"Dialogue ID {pending_dialogue_id!r} is not followed by dialogue"
                )
            flush()
            continue
        id_match = re.fullmatch(
            r"\s*<!--\s*audience-dialogue-id:\s*([^\s]+)\s*-->\s*", ln
        )
        if id_match:
            flush()
            if pending_dialogue_id is not None:
                raise ValueError(
                    f"Dialogue ID {pending_dialogue_id!r} is not followed by dialogue"
                )
            pending_dialogue_id = id_match.group(1)
            continue
        if ln.lstrip().startswith("<!--"):
            if pending_dialogue_id is not None:
                raise ValueError(
                    f"Dialogue ID {pending_dialogue_id!r} is not followed by dialogue"
                )
            flush()
            continue
        if ln.startswith(">"):
            if mode not in (None, "dialogue"):
                flush()
            mode = "dialogue"
            buf.append(ln)
            continue
        if pending_dialogue_id is not None:
            raise ValueError(
                f"Dialogue ID {pending_dialogue_id!r} is not followed by dialogue"
            )
        if re.match(r"^[-*]\s+", ln) or re.match(r"^\d+\.\s+", ln):
            if mode not in (None, "list"):
                flush()
            mode = "list"
            buf.append(re.sub(r"^[-*]\s+", "", ln).strip())
            continue
        if mode not in (None, "para"):
            flush()
        mode = "para"
        buf.append(ln)
    flush()
    if pending_dialogue_id is not None:
        raise ValueError(f"Dialogue ID {pending_dialogue_id!r} has no dialogue block")
    return blocks


def collect_json_values(node: object, key: str) -> set[str]:
    values: set[str] = set()
    if isinstance(node, dict):
        value = node.get(key)
        if isinstance(value, str):
            values.add(value)
        for child in node.values():
            values.update(collect_json_values(child, key))
    elif isinstance(node, list):
        for child in node:
            values.update(collect_json_values(child, key))
    return values


def load_audience_performance(
    performance_src: Path = AUDIENCE_PERFORMANCE_SRC,
    *,
    narrative_id: str = "audience:light-delay-master",
    source_outline: dict | None = None,
) -> dict[str, dict]:
    data = json.loads(performance_src.read_text(encoding="utf-8"))
    entries = data.get("entries", [])
    by_id = {entry["id"]: entry for entry in entries}
    if len(by_id) != len(entries):
        raise ValueError("Duplicate IDs in audience dialogue performance data")

    outline = source_outline or json.loads(MASTER_OUTLINE_SRC.read_text(encoding="utf-8"))
    if data.get("narrativeId") != narrative_id:
        raise ValueError("Audience narrativeId must be stable and must not embed a revision")
    if data.get("sourceOutlineId") != outline.get("outline", {}).get("id"):
        raise ValueError("Audience sourceOutlineId does not match its registered outline")
    outline_ids = collect_json_values(outline, "id")
    known_speakers = set(CHARACTER_ID_BY_SPEAKER.values())
    for entry in entries:
        if entry["sourceStepId"] not in outline_ids:
            raise ValueError(
                f"Unknown outline sourceStepId for {entry['id']}: {entry['sourceStepId']}"
            )
        if entry["speakerId"] not in known_speakers:
            raise ValueError(
                f"Unknown speakerId for {entry['id']}: {entry['speakerId']}"
            )
    return by_id


def audience_instruct(entry: dict, *, lang: str) -> str:
    intent = entry["intent"]["en"].strip()
    delivery = entry["delivery"][lang]["en"].strip()
    language = "English" if lang == "en" else "Spanish"
    instruction = (
        f"Speak {language}. Dramatic situation: {intent} "
        f"Performance and delivery: {delivery}"
    )
    return instruction


def cue_narrator(text: str, *, lang: str) -> str:
    text = apply_pronunciations(text, lang=lang)
    if lang == "en":
        text = expand_en_speakables(text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    return f"[Narrator]\n{text.strip()}\n"


def cue_pause(label: str) -> str:
    return f"[Narrator]\n[PAUSE 1200] {label.strip()}\n"


def audience_heading_cues(
    title: str, *, lang: str, chapter_i: list[int]
) -> list[str]:
    """Speak section labels alone, then pause before the section title."""
    t = title.strip()
    m = re.match(r"^(Prologue|Prólogo)\s*[.—–-]\s*(.+)$", t, flags=re.I)
    if m:
        word = "Prologue." if lang == "en" else "Prólogo."
        sub = m.group(2).strip()
        return [cue_narrator(word, lang=lang), cue_pause(sub)]

    m = re.match(r"^(?:Chapter|Capítulo)\s+(\d+)\s*[.—–-]\s*(.+)$", t, flags=re.I)
    if m:
        n = int(m.group(1))
        chapter_i[0] = max(chapter_i[0], n)
        body = m.group(2).strip()
        prefix = f"Chapter {n}" if lang == "en" else f"Capítulo {n}"
        return [cue_narrator(f"{prefix}.", lang=lang), cue_pause(body)]

    # Unnumbered H2: assign next chapter number (prologue already handled above).
    chapter_i[0] += 1
    n = chapter_i[0]
    prefix = f"Chapter {n}" if lang == "en" else f"Capítulo {n}"
    return [cue_narrator(f"{prefix}.", lang=lang), cue_pause(t)]


def build_voices(
    md: str,
    *,
    lang: str,
    revision: str,
    instruct_by_index: list[str] | None = None,
    performance_by_id: dict[str, dict] | None = None,
    source: str = "outline",
    audience_title: str = "Light Delay",
    audience_source_label: str = "the master outline",
    audience_voices_path: str = "docs/wip/audience-narrative.voices.en.md",
    audience_chunks_dir: str = "E:/Models/Qwen3-TTS/output/outline-chunks/en-audience",
    audience_out_mp3: str | None = None,
) -> tuple[str, list[tuple[str | None, str, str]], list[str], list[str]]:
    blocks = parse_blocks(md)
    out: list[str] = []
    if source == "audience":
        if lang == "en":
            generate = (
                "Generate: `python scripts/generate-dual-outline-audio.py --lang en "
                f"--script {audience_voices_path} "
                f"--chunks-dir {audience_chunks_dir}"
            )
            if audience_out_mp3:
                generate += f" --out {audience_out_mp3}"
            generate += "`\n\n---\n"
            out.append(
                f"# {audience_title} — audience narrative TTS (English)\n\n"
                f"Revision {revision} (from {audience_source_label}). "
                "Chaptered short story for listeners; no production frontmatter.\n"
                "Speaker tags: [Narrator], [Zao], [Voss], [Harlan], [Elin], [Sorell], [Okoye].\n"
                "Spoken name: Soréll; tag and editorial spelling stay ASCII [Sorell]. "
                "Dialogue from attributed blockquotes only.\n"
                "Cast/ref: `docs/wip/qwen3-tts-cast.json`.\n"
                f"{generate}"
            )
        else:
            out.append(
                "# Lúz Tardía — relato TTS para público (español)\n\n"
                f"Revisión {revision} (desde la escaleta maestra). "
                "Relato por capítulos; sin frontmatter de producción.\n"
                "Etiquetas: [Narrator], [Zao], [Voss], [Harlan], [Elin], [Sorell], [Okoye].\n"
                "Nombre hablado: Sorél; la grafía editorial y la etiqueta siguen como [Sorell]. "
                "Diálogo sólo desde citas atribuidas.\n"
                "Cast/ref: `docs/wip/qwen3-tts-cast.es.json`.\n"
                "Generar: `python scripts/generate-dual-outline-audio.py --lang es "
                "--script docs/wip/audience-narrative.voices.es.md "
                "--chunks-dir E:/Models/Qwen3-TTS/output/outline-chunks/es-audience`\n\n---\n"
            )
        out.append(
            cue_pause(
                f"{audience_title}. Revision {revision}."
                if lang == "en"
                else f"Lúz Tardía. Revisión {revision}."
            )
        )
    elif lang == "en":
        out.append(
            "# Light Delay — multi-speaker TTS outline (English)\n\n"
            f"Revision {revision} (from the master outline). "
            "Speaker tags: [Narrator], [Zao], [Voss], [Harlan], [Elin], [Sorell], [Okoye].\n"
            "Spoken name: Soréll / Soréll’s; keep ASCII [Sorell] only as the speaker tag.\n"
            "Dialogue speakers are taken only from attributed master blockquotes "
            "(`speakerId` / `> **Name:**`), not from heuristic quote matching.\n"
            "Cast/ref: `docs/wip/qwen3-tts-cast.json`, `docs/wip/kokoro-voice-cast.json`.\n"
            "Generate: `python scripts/generate-dual-outline-audio.py --lang en "
            "--script docs/wip/outiline-for-kokoro-tts.voices.md`\n\n---\n"
        )
        out.append(
            cue_pause(
                f"Light Delay. General narrative outline. Revision {revision}."
            )
        )
    else:
        out.append(
            "# Lúz Tardía — esquema TTS multi-voz (español)\n\n"
            f"Revisión {revision} (desde la escaleta maestra). "
            "Etiquetas: [Narrator], [Zao], [Voss], [Harlan], [Elin], [Sorell], [Okoye].\n"
            "Nombre hablado: Sorél; la grafía editorial y la etiqueta siguen en ASCII [Sorell].\n"
            "Los hablantes de diálogo salen sólo de las citas atribuidas del master "
            "(`speakerId` / `> **Nombre:**`), no de heurísticas sobre comillas.\n"
            "Los [QwenInstruct] son los mismos directores de interpretación que en inglés "
            "(el modelo los entiende en inglés mientras habla español).\n"
            "Cast/ref: `docs/wip/qwen3-tts-cast.es.json` (narración Kokoro ES pendiente de cast dedicado).\n"
            "Generar: `python scripts/generate-dual-outline-audio.py --lang es "
            "--script docs/wip/outiline-for-kokoro-tts.voices.es.md`\n\n---\n"
        )
        out.append(
            cue_pause(
                f"Lúz Tardía. Escaleta narrativa general. Revisión {revision}."
            )
        )

    missing_instruct: list[str] = []
    dialogue_log: list[tuple[str | None, str, str]] = []
    instructs_out: list[str] = []
    dialogue_i = 0
    audience_chapter_i = [0]
    used_performance_ids: set[str] = set()

    for kind, text, dialogue_id in blocks:
        if kind == "heading":
            level = len(text) - len(text.lstrip("#"))
            title = re.sub(r"^#+\s*", "", text).strip()
            if level == 1:
                continue
            if title.lower().startswith("editorial status") or title.lower().startswith(
                "estado editorial"
            ):
                continue
            if source == "audience":
                out.extend(
                    audience_heading_cues(title, lang=lang, chapter_i=audience_chapter_i)
                )
                continue
            spoken = speak_heading(title, lang=lang)
            spoken = apply_pronunciations(spoken, lang=lang)
            if lang == "en":
                spoken = expand_en_speakables(spoken)
            out.append(cue_pause(spoken))
            continue

        if kind == "dialogue":
            raw = " ".join(
                ln[1:].strip() if ln.startswith(">") else ln for ln in text.splitlines()
            )
            m = re.match(
                r"\*\*([^*]+):\*\*\s*[«“\"](.+)[»”\"]\s*\.?$", raw.strip(), re.S
            )
            if not m:
                out.append(cue_narrator(raw, lang=lang))
                continue
            label, quote = m.group(1), m.group(2)
            quote = re.sub(r"\*([^*]+)\*", r"\1", quote)
            speaker = speaker_from_label(label)
            key = norm_quote(quote)
            if source == "audience":
                if performance_by_id is None:
                    raise ValueError("Audience performance data was not supplied")
                if dialogue_id is None:
                    raise ValueError(
                        f"Audience dialogue has no stable ID: {speaker}: {quote[:80]}"
                    )
                if dialogue_id in used_performance_ids:
                    raise ValueError(f"Duplicate audience dialogue ID: {dialogue_id}")
                entry = performance_by_id.get(dialogue_id)
                if entry is None:
                    raise ValueError(
                        f"No performance entry for audience dialogue ID: {dialogue_id}"
                    )
                expected_speaker = CHARACTER_ID_BY_SPEAKER.get(speaker)
                if entry["speakerId"] != expected_speaker:
                    raise ValueError(
                        f"Speaker mismatch for {dialogue_id}: Markdown {expected_speaker}, "
                        f"performance data {entry['speakerId']}"
                    )
                instruct = audience_instruct(entry, lang=lang)
                used_performance_ids.add(dialogue_id)
            elif instruct_by_index is not None and dialogue_i < len(instruct_by_index):
                instruct = instruct_by_index[dialogue_i]
            else:
                instruct = INSTRUCT_EN.get(key) or INSTRUCT_EN.get(key.lstrip("¿¡"))
            if not instruct:
                instruct = (
                    "Clear, natural delivery. Stay in character; no caricature."
                )
                missing_instruct.append(f"{speaker}: {quote[:80]}")
            instructs_out.append(instruct)
            instruct = apply_pronunciations(instruct, lang=lang)
            dialogue_log.append((dialogue_id, speaker, quote[:60]))
            dialogue_i += 1

            quote = apply_pronunciations(quote, lang=lang)
            spoken = quote.strip().strip("«»\"“”").strip()
            spoken = f'"{spoken}"'
            if source == "audience" and dialogue_id:
                out.append(
                    f"<!-- audience-dialogue-id: {dialogue_id} -->\n"
                    f"[{speaker}]\n[QwenInstruct] {instruct}\n{spoken}\n"
                )
            else:
                out.append(f"[{speaker}]\n[QwenInstruct] {instruct}\n{spoken}\n")
            continue

        if kind == "list":
            items = [apply_pronunciations(i, lang=lang) for i in text.splitlines() if i.strip()]
            if lang == "en":
                items = [expand_en_speakables(i) for i in items]
            out.append(cue_narrator(" ".join(items), lang=lang))
            continue

        if kind == "para":
            if text.strip().startswith("**Editorial") or text.strip().startswith(
                "**Estado"
            ):
                continue
            stripped = text.strip()
            if source == "audience" and re.fullmatch(r"\*[^*]+\*", stripped):
                continue
            out.append(cue_narrator(text, lang=lang))
            continue

    if source == "audience" and performance_by_id is not None:
        unused = sorted(set(performance_by_id) - used_performance_ids)
        if unused:
            raise ValueError(
                f"Performance entries not used by {lang} audience source: {unused}"
            )

    body = "\n".join(out)
    body = re.sub(r"\n{3,}", "\n\n", body)
    return body, dialogue_log, missing_instruct, instructs_out


def build_plain(voices_md: str) -> str:
    """Sister file without speaker/instruct tags (narration stream)."""
    text = voices_md
    if "\n---\n" in text:
        text = text.split("\n---\n", 1)[1]
    text = re.sub(
        r"^\[(?:Narrator|Zao|Voss|Harlan|Elin|Sorell|Okoye|Cael)\]\s*\n",
        "",
        text,
        flags=re.M,
    )
    text = re.sub(r"^\[QwenInstruct\][^\n]*\n", "", text, flags=re.M)
    return text.strip() + "\n"


def write_pair(
    *,
    en_src: Path,
    es_src: Path,
    en_voices_out: Path,
    es_voices_out: Path,
    en_plain_out: Path | None,
    es_plain_out: Path | None,
    source: str,
    language: str,
) -> None:
    en_md = en_src.read_text(encoding="utf-8")
    es_md = es_src.read_text(encoding="utf-8")
    master = json.loads(MASTER_OUTLINE_SRC.read_text(encoding="utf-8"))
    revision_value = master.get("outline", {}).get("revision")
    if not isinstance(revision_value, int):
        raise ValueError("Master outline revision must be an integer")
    en_revision = str(revision_value)
    es_localization = master.get("outline", {}).get("localization", {}).get("translations", {}).get("es", {})
    es_revision_value = revision_value if es_localization.get("status") == "current" else es_localization.get("lastSyncedRevision")
    if not isinstance(es_revision_value, int):
        raise ValueError("Spanish translation must record lastSyncedRevision while it is not current")
    es_revision = str(es_revision_value)
    performance_by_id = load_audience_performance() if source == "audience" else None

    if language in ("en", "all"):
        en_voices, en_log, en_miss, _ = build_voices(
            en_md,
            lang="en",
            revision=en_revision,
            performance_by_id=performance_by_id,
            source=source,
        )
        en_voices_out.write_text(en_voices, encoding="utf-8")
        if en_plain_out is not None:
            en_plain_out.write_text(build_plain(en_voices), encoding="utf-8")
        print(f"Wrote {source} EN: dialogues={len(en_log)} revision={en_revision} -> {en_voices_out.name}")
        if en_miss:
            print("EN missing curated instruct (used fallback):", len(en_miss))
            for item in en_miss:
                print(" ", item)

    if language in ("es", "all"):
        es_voices, es_log, es_miss, _ = build_voices(
            es_md,
            lang="es",
            revision=es_revision,
            performance_by_id=performance_by_id,
            source=source,
        )
        es_voices_out.write_text(es_voices, encoding="utf-8")
        if es_plain_out is not None:
            es_plain_out.write_text(build_plain(es_voices), encoding="utf-8")
        print(f"Wrote {source} ES: dialogues={len(es_log)} revision={es_revision} -> {es_voices_out.name}")
        if es_miss:
            print("ES missing curated instruct (used fallback):", len(es_miss))
            for item in es_miss:
                print(" ", item)


def load_outline_by_id(outline_id: str) -> dict:
    for outline_path in (ROOT / "data" / "outlines").glob("*.json"):
        candidate = json.loads(outline_path.read_text(encoding="utf-8"))
        if candidate.get("outline", {}).get("id") == outline_id:
            return candidate
    raise ValueError(f"Unknown audience source outline: {outline_id}")


def write_audience_profile(*, profile_key: str, language: str) -> None:
    registry = json.loads(AUDIENCE_NARRATIVES_SRC.read_text(encoding="utf-8"))
    profile = next(
        (item for item in registry.get("narratives", []) if item.get("key") == profile_key),
        None,
    )
    if profile is None:
        raise ValueError(f"Unknown audience profile: {profile_key}")

    outline = load_outline_by_id(profile["sourceOutlineId"])
    revision_value = outline.get("outline", {}).get("revision")
    if not isinstance(revision_value, int):
        raise ValueError("Audience source outline revision must be an integer")
    performance_by_id = load_audience_performance(
        ROOT / profile["performancePath"],
        narrative_id=profile["id"],
        source_outline=outline,
    )

    requested = profile["languages"].keys() if language == "all" else (language,)
    for lang in requested:
        output = profile["languages"].get(lang)
        if output is None or output.get("status") == "not_started":
            print(f"Skipped audience {profile_key} {lang}: not started")
            continue
        revision = revision_value
        if lang == "es" and output.get("status") != "current":
            translated_revision = (
                outline.get("outline", {})
                .get("localization", {})
                .get("translations", {})
                .get("es", {})
                .get("lastSyncedRevision")
            )
            if isinstance(translated_revision, int):
                revision = translated_revision
        source_path = ROOT / output["prosePath"]
        voices_path = ROOT / output["voicesPath"]
        if profile["key"] == "festival-master":
            chunks_dir = (
                "E:/Models/Qwen3-TTS/output/outline-chunks/en-festival-audience"
                if lang == "en"
                else "E:/Models/Qwen3-TTS/output/outline-chunks/es-festival-audience"
            )
            out_mp3 = (
                "E:/Models/Qwen3-TTS/output/light-delay-festival-audience-dual-en.mp3"
                if lang == "en"
                else "E:/Models/Qwen3-TTS/output/light-delay-festival-audience-dual-es.mp3"
            )
        else:
            chunks_dir = (
                "E:/Models/Qwen3-TTS/output/outline-chunks/en-audience"
                if lang == "en"
                else "E:/Models/Qwen3-TTS/output/outline-chunks/es-audience"
            )
            out_mp3 = None
        voices, log, missing, _ = build_voices(
            source_path.read_text(encoding="utf-8"),
            lang=lang,
            revision=str(revision),
            performance_by_id=performance_by_id,
            source="audience",
            audience_title=profile["title"].get(lang, profile["title"]["en"]),
            audience_source_label=(
                "the master outline"
                if profile["key"] == "master"
                else f"outline {profile['sourceOutlineId']}"
            ),
            audience_voices_path=output["voicesPath"],
            audience_chunks_dir=chunks_dir,
            audience_out_mp3=out_mp3,
        )
        voices_path.write_text(voices, encoding="utf-8")
        print(
            f"Wrote audience {profile_key} {lang.upper()}: "
            f"dialogues={len(log)} revision={revision} -> {voices_path.name}"
        )
        if missing:
            print(f"{lang.upper()} missing curated instruct (used fallback):", len(missing))
            for item in missing:
                print(" ", item)


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        choices=("outline", "audience", "all"),
        default="all",
        help="Which TTS markdown pair to rebuild (default: all).",
    )
    parser.add_argument(
        "--lang",
        choices=("en", "es", "all"),
        default="all",
        help="Which language output to rebuild (default: all).",
    )
    parser.add_argument(
        "--audience",
        choices=("master", "festival-master"),
        default="master",
        help="Registered audience narrative to rebuild (default: master).",
    )
    args = parser.parse_args()

    if args.source in ("outline", "all"):
        write_pair(
            en_src=EN_SRC,
            es_src=ES_SRC,
            en_voices_out=WIP / "outiline-for-kokoro-tts.voices.md",
            es_voices_out=WIP / "outiline-for-kokoro-tts.voices.es.md",
            en_plain_out=WIP / "outiline-for-kokoro-tts.md",
            es_plain_out=WIP / "outiline-for-kokoro-tts.es.md",
            source="outline",
            language=args.lang,
        )
    if args.source in ("audience", "all"):
        write_audience_profile(profile_key=args.audience, language=args.lang)


if __name__ == "__main__":
    main()
