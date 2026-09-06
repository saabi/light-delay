#!/usr/bin/env python3
"""Build multi-speaker TTS outlines from master narrative Markdown exports.

Speakers for dialogue come ONLY from attributed blockquotes
(`> **Name:** …`) which mirror `speakerId` in the master JSON — never from
heuristic quote matching (that caused prior errors).

Usage:
  python scripts/build-tts-voices-outlines.py
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WIP = ROOT / "docs" / "wip"

EN_SRC = WIP / "general-narrative-outline.en.md"
ES_SRC = WIP / "general-narrative-outline.es.md"

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
    "and if the ai learned it wrong?": (
        "Careful technical worry. Controlled; a real risk stated without panic."
    ),
    "and if the artificial intelligence learned it wrong?": (
        "Careful technical worry. Controlled; a real risk stated without panic."
    ),
    "misreading is possible. the ai can arrange the patterns, but it cannot convert uncertainty into knowledge.": (
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


def sorell_spoken(text: str, *, lang: str) -> str:
    # Spoken form Soréll; never rewrite [Sorell] tags (those are added separately).
    text = re.sub(r"\bSorell’s\b", "Soréll’s", text)
    text = re.sub(r"\bSorell's\b", "Soréll's", text)
    text = re.sub(r"\bSorell\b", "Soréll", text)
    if lang == "es":
        text = re.sub(r"\bde Soréll\b", "de Soréll", text)
    return text


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


def parse_blocks(md: str) -> list[tuple[str, str]]:
    """Return list of (kind, text) where kind is heading|para|dialogue|listitem|skip."""
    # Drop generated banner / HTML comments
    md = re.sub(r"<!--.*?-->", "", md, flags=re.S)
    lines = md.splitlines()
    blocks: list[tuple[str, str]] = []
    buf: list[str] = []
    mode = None  # para | dialogue | list

    def flush():
        nonlocal buf, mode
        if not buf:
            mode = None
            return
        text = "\n".join(buf).strip()
        buf = []
        if mode == "dialogue":
            blocks.append(("dialogue", text))
        elif mode == "list":
            blocks.append(("list", text))
        else:
            blocks.append(("para", text))
        mode = None

    for ln in lines:
        if not ln.strip():
            flush()
            continue
        if ln.startswith("#"):
            flush()
            blocks.append(("heading", ln.strip()))
            continue
        if ln.strip() == "---":
            flush()
            continue
        if ln.startswith(">"):
            if mode not in (None, "dialogue"):
                flush()
            mode = "dialogue"
            buf.append(ln)
            continue
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
    return blocks


def cue_narrator(text: str, *, lang: str) -> str:
    text = sorell_spoken(text, lang=lang)
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
    """Audience chapter titles: pause after Prologue/Prólogo; Chapter/Capítulo N — title."""
    t = title.strip()
    m = re.match(r"^(Prologue|Prólogo)\s*[—–-]\s*(.+)$", t, flags=re.I)
    if m:
        word = "Prologue." if lang == "en" else "Prólogo."
        sub = m.group(2).strip()
        return [cue_narrator(word, lang=lang), cue_pause(sub)]

    m = re.match(r"^(?:Chapter|Capítulo)\s+(\d+)\s*[—–-]\s*(.+)$", t, flags=re.I)
    if m:
        n = int(m.group(1))
        chapter_i[0] = max(chapter_i[0], n)
        body = m.group(2).strip()
        prefix = f"Chapter {n}" if lang == "en" else f"Capítulo {n}"
        return [cue_pause(f"{prefix} — {body}")]

    # Unnumbered H2: assign next chapter number (prologue already handled above).
    chapter_i[0] += 1
    n = chapter_i[0]
    prefix = f"Chapter {n}" if lang == "en" else f"Capítulo {n}"
    return [cue_pause(f"{prefix} — {t}")]


def build_voices(
    md: str,
    *,
    lang: str,
    revision: str,
    instruct_by_index: list[str] | None = None,
    source: str = "outline",
) -> tuple[str, list[tuple[str, str]], list[str], list[str]]:
    blocks = parse_blocks(md)
    out: list[str] = []
    if source == "audience":
        if lang == "en":
            out.append(
                "# Light Delay — audience narrative TTS (English)\n\n"
                f"Revision {revision} (from `audience-narrative.en.md`). "
                "Chaptered short story for listeners; no production frontmatter.\n"
                "Speaker tags: [Narrator], [Zao], [Voss], [Harlan], [Elin], [Sorell], [Okoye].\n"
                "Spoken name: Soréll; tag stays ASCII [Sorell]. "
                "Dialogue from attributed blockquotes only.\n"
                "Cast/ref: `docs/wip/qwen3-tts-cast.json`.\n"
                "Generate: `python scripts/generate-dual-outline-audio.py --lang en "
                "--script docs/wip/audience-narrative.voices.en.md "
                "--chunks-dir E:/Models/Qwen3-TTS/output/outline-chunks/en-audience`\n\n---\n"
            )
        else:
            out.append(
                "# Light Delay — relato TTS para público (español)\n\n"
                f"Revisión {revision} (desde `audience-narrative.es.md`). "
                "Relato por capítulos; sin frontmatter de producción.\n"
                "Etiquetas: [Narrator], [Zao], [Voss], [Harlan], [Elin], [Sorell], [Okoye].\n"
                "Nombre hablado: Soréll; etiqueta [Sorell]. "
                "Diálogo sólo desde citas atribuidas.\n"
                "Cast/ref: `docs/wip/qwen3-tts-cast.es.json`.\n"
                "Generar: `python scripts/generate-dual-outline-audio.py --lang es "
                "--script docs/wip/audience-narrative.voices.es.md "
                "--chunks-dir E:/Models/Qwen3-TTS/output/outline-chunks/es-audience`\n\n---\n"
            )
        out.append(
            cue_pause(
                f"Light Delay. Revision {revision}."
                if lang == "en"
                else f"Light Delay. Revisión {revision}."
            )
        )
    elif lang == "en":
        out.append(
            "# Light Delay — multi-speaker TTS outline (English)\n\n"
            f"Revision {revision} (from `general-narrative-outline.en.md`). "
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
            "# Light Delay — esquema TTS multi-voz (español)\n\n"
            f"Revisión {revision} (desde `general-narrative-outline.es.md`). "
            "Etiquetas: [Narrator], [Zao], [Voss], [Harlan], [Elin], [Sorell], [Okoye].\n"
            "Nombre hablado: Soréll; la etiqueta del hablante sigue en ASCII [Sorell].\n"
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
                f"Light Delay. Escaleta narrativa general. Revisión {revision}."
            )
        )

    missing_instruct: list[str] = []
    dialogue_log: list[tuple[str, str]] = []
    instructs_out: list[str] = []
    dialogue_i = 0
    audience_chapter_i = [0]

    for kind, text in blocks:
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
            spoken = sorell_spoken(spoken, lang=lang)
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
            if instruct_by_index is not None and dialogue_i < len(instruct_by_index):
                instruct = instruct_by_index[dialogue_i]
            else:
                instruct = INSTRUCT_EN.get(key) or INSTRUCT_EN.get(key.lstrip("¿¡"))
            if not instruct:
                instruct = (
                    "Clear, natural delivery. Stay in character; no caricature."
                )
                missing_instruct.append(f"{speaker}: {quote[:80]}")
            instructs_out.append(instruct)
            dialogue_log.append((speaker, quote[:60]))
            dialogue_i += 1

            quote = sorell_spoken(quote, lang=lang)
            spoken = quote.strip().strip("«»\"“”").strip()
            spoken = f'"{spoken}"'
            out.append(
                f"[{speaker}]\n[QwenInstruct] {instruct}\n{spoken}\n"
            )
            continue

        if kind == "list":
            items = [sorell_spoken(i, lang=lang) for i in text.splitlines() if i.strip()]
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
) -> None:
    en_md = en_src.read_text(encoding="utf-8")
    es_md = es_src.read_text(encoding="utf-8")
    rev_en = re.search(r"revision\s+(\d+)", en_md, re.I)
    rev_es = re.search(r"revisión\s+(\d+)", es_md, re.I)
    revision = (rev_en or rev_es).group(1) if (rev_en or rev_es) else "14"

    en_voices, en_log, en_miss, en_instructs = build_voices(
        en_md, lang="en", revision=revision, source=source
    )
    es_voices, es_log, es_miss, _ = build_voices(
        es_md,
        lang="es",
        revision=revision,
        instruct_by_index=en_instructs,
        source=source,
    )

    assert len(en_log) == len(es_log), f"dialogue count EN {len(en_log)} != ES {len(es_log)}"
    mismatches = [
        (i, a, b)
        for i, ((a, _), (b, _)) in enumerate(zip(en_log, es_log))
        if a != b
    ]
    if mismatches:
        raise SystemExit(f"Speaker parity mismatch: {mismatches[:10]}")

    en_voices_out.write_text(en_voices, encoding="utf-8")
    es_voices_out.write_text(es_voices, encoding="utf-8")
    if en_plain_out is not None:
        en_plain_out.write_text(build_plain(en_voices), encoding="utf-8")
    if es_plain_out is not None:
        es_plain_out.write_text(build_plain(es_voices), encoding="utf-8")

    print(
        f"Wrote {source}: dialogues={len(en_log)} revision={revision} "
        f"-> {en_voices_out.name} / {es_voices_out.name}"
    )
    for i, ((a, qa), (b, qb)) in enumerate(zip(en_log, es_log)):
        print(f"  {i:02d} {a:7} | {qa[:50]!r}")
        print(f"       {b:7} | {qb[:50]!r}")
    if en_miss:
        print("EN missing curated instruct (used fallback):", len(en_miss))
        for m in en_miss:
            print(" ", m)
    if es_miss:
        print("ES missing curated instruct (used fallback):", len(es_miss))


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        choices=("outline", "audience", "all"),
        default="all",
        help="Which TTS markdown pair to rebuild (default: all).",
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
        )
    if args.source in ("audience", "all"):
        write_pair(
            en_src=WIP / "audience-narrative.en.md",
            es_src=WIP / "audience-narrative.es.md",
            en_voices_out=WIP / "audience-narrative.voices.en.md",
            es_voices_out=WIP / "audience-narrative.voices.es.md",
            en_plain_out=None,
            es_plain_out=None,
            source="audience",
        )


if __name__ == "__main__":
    main()
