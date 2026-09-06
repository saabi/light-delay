#!/usr/bin/env python3
"""Inject [QwenInstruct] lines before dialogue cues in the Kokoro voices outline.

Instructs are natural-language performance directions (Qwen3-TTS style), chosen from
each line's narrative/situational context. They do not change speaker identity.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOICES = ROOT / "docs" / "wip" / "outiline-for-kokoro-tts.voices.md"

# Exact quote body (as stored in voices.md) -> performance instruct
INSTRUCTS: dict[str, str] = {
    '"We know what the mouth told us. That isn’t the same as knowing who told it to speak."': (
        "Quiet, controlled dread. Slow, even cadence. Philosophical rather than angry; "
        "a man stating a hard truth he has already accepted."
    ),
    '"I wish they were right."': (
        "Soft, bitter understatement. Low volume. Looking at hopeful people he does not believe; "
        "regret without self-pity."
    ),
    '"They built a door in our system before we knew they existed. Now the door tells us when to walk through."': (
        "Measured political fear. Clear officer diction. Rising pressure on the second sentence; "
        "do not shout."
    ),
    '"We studied everything they gave us before we agreed to send a single ship out there. That isn’t fear. It’s respect."': (
        "Warm but firm. Defending rigor as respect, not panic. Precise diction; slight French-English "
        "musicality without caricature."
    ),
    '"He wasn’t hoping."': (
        "Dry, flat correction. Quiet certainty. Almost no emotion on the surface; a sharp observational cut."
    ),
    '"You find faults for a living. That doesn’t make everyone a fault."': (
        "Calm command rebuke. Steady baritone authority. Mild warmth; not scolding."
    ),
    '"If Zao says we’re on time, we’re on time."': (
        "Familiar trust. Light confidence. Easy, almost casual, still in command register."
    ),
    '"The outbound throat closes behind us. Until the return window, there’s no turning around."': (
        "Solemn operational fact. Clear, unhurried. Let the irreversibility land without drama."
    ),
    '"They think the mission looks too aggressive."': (
        "Observational, slightly wry. Clear security-officer diction; reporting what she sees on the feed, not joking."
    ),
    '"We’re making first contact in a ninety-metre phallus called Celestial Ardor."': (
        "Deadpan dry humor. Flat delivery; no laugh. Technical woman stating an absurd fact plainly."
    ),
    '"I didn’t name it."': (
        "Dry clipped amusement. Short, underplayed. Deadpan follow-through after her own joke."
    ),
    '"Let’s make the greeting less ambiguous."': (
        "Professional focus. Constructive, slightly urgent, still collegial."
    ),
    '"How do you say hello to something you’ve never heard answer?"': (
        "Genuine curious wonder. Softened edges; thoughtful, not joking."
    ),
    '"They wrote the primer. We haven’t spoken back."': (
        "Thoughtful unease. Quiet realization; weight on the second sentence."
    ),
    '"When the mouth goes quiet, that isn’t nothing. Silence is still a choice."': (
        "Quiet pedagogical weight. Soft certainty; let the second sentence land as principle, not flourish."
    ),
    '"I’ve found a grave attempt to sabotage the mission—"': (
        "Urgent wireless report cut mid-sentence. Clear engineer diction; rising alarm; "
        "trail off abruptly as if the channel dies."
    ),
    '"And if the artificial intelligence learned it wrong?"': (
        "Careful technical worry. Controlled; a real risk stated without panic."
    ),
    '"And what if we’re the ones being read wrong?"': (
        "Ominous foreshadowing. Soft, even, unsettling. Do not overact."
    ),
    '"Just in case: goodbye. Harlan’s at the door."': (
        "Compressed farewell under lethal pressure. Fast but clear; fear barely breaking dry control; "
        "urgency without screaming."
    ),
    '"Who did you send that to?"': (
        "Confrontation. Controlled threat. Close, hard consonants; low and dangerous."
    ),
    '"Proxima’s behind Jupiter. Earth won’t know until we’re already there."': (
        "Defiant dying clarity. Breath short; force the facts out before he reaches her."
    ),
    '"How could you? Why?"': (
        "Performative shock and accusation for an audience. Hard, clear; manufactured moral outrage, not genuine grief."
    ),
    '"Before launch she asked me what it would take to delay the crossing. I thought it was professional caution."': (
        "Smooth plausible lie. Calm, earnest, almost gentle. No tell of guilt in the surface tone."
    ),
    '"You’re treating the first explanation as if it were the only one. That’s exactly what I warned you not to do out there."': (
        "Sharp intellectual challenge. Firm, not shrill; refusing a closed story from custody."
    ),
    '"Lose helium-three and the mix goes deuterium-rich. More side-reaction neutrons, more fuel to hold thrust. Keep bleeding it and we miss the window."': (
        "Clinical technical persuasion. Even, explanatory, authoritative; selling a false theory as physics."
    ),
    '"She was trying to finish the report she started - to Earth. The guidance trunk was down, so she entered the aim manually. She missed."': (
        "False explanation delivered earnestly. Soft certainty; protective storytelling that is a lie."
    ),
    '"Zao didn’t miss."': (
        "Flat absolute refusal. Quiet steel; no hesitation."
    ),
    '"She was frightened. She knew someone was coming."': (
        "Soft false empathy. Gentle, almost kind; still a manipulation."
    ),
    '"Now they’ll never know who saved them."': (
        "Bitter self-mythology. Quiet, wounded pride; not a roar."
    ),
    '"You don’t know what they are. You don’t get to answer for Earth."': (
        "Desperate accusation and plea. Hard, clear; he believes he is defending Earth, not confessing."
    ),
    '"If they think we’re harmless, they come closer. If they see a species that bites, maybe they wait. We needed time."': (
        "Pleading justification. Desperate logic, not a boast; voice cracking toward the end."
    ),
    '"It isn’t disarmed. It just isn’t going off here."': (
        "Precise engineer calm under fire. Flat clarity; make the limit explicit without triumph."
    ),
    '"They wrote the primer. This is the first time they’ll hear us read it back."': (
        "Ceremonial resolve. Focused, hushed intensity; first-contact weight."
    ),
    '"I’m sorry."': (
        "Heavy quiet apology. Slow; more than the detention — personal failure landing softly."
    ),
    '"They’re sending someone."': (
        "Awe and hush. Soft wonder after silence; share the news without celebrating."
    ),
    '"You made it in time."': (
        "Soft grief tribute. Intimate, broken warmth; speaking to a photograph and a dead engineer."
    ),
}


def norm_key(q: str) -> str:
    return (
        q.strip()
        .replace("’", "'")
        .replace("‘", "'")
        .replace("“", '"')
        .replace("”", '"')
    )


# Build lookup with normalized keys
LOOKUP = {norm_key(k): v for k, v in INSTRUCTS.items()}


def main() -> None:
    text = VOICES.read_text(encoding="utf-8")
    # Remove any prior QwenInstruct lines so re-runs are idempotent
    text = re.sub(r"^\[QwenInstruct\][^\n]*\n", "", text, flags=re.M)

    parts = re.split(r"(\n\s*\n)", text)
    out: list[str] = []
    hits = 0
    missing: list[str] = []

    i = 0
    while i < len(parts):
        chunk = parts[i]
        sep = parts[i + 1] if i + 1 < len(parts) else ""
        m = re.match(r"^\[([A-Za-z]+)\]\s*\n([\s\S]+)$", chunk.strip())
        if m:
            speaker, body = m.group(1), m.group(2).strip()
            # body may already start with [QwenInstruct] if odd parse
            body_lines = body.split("\n")
            spoken = "\n".join(body_lines).strip()
            if spoken.startswith("[QwenInstruct]"):
                spoken = "\n".join(body_lines[1:]).strip()
            if spoken.startswith(("\"", "“")) and speaker != "Narrator":
                key = norm_key(spoken)
                instruct = LOOKUP.get(key)
                if instruct:
                    chunk = f"[{speaker}]\n[QwenInstruct] {instruct}\n{spoken}"
                    hits += 1
                else:
                    missing.append(f"{speaker}: {spoken[:80]}")
        out.append(chunk)
        if sep:
            out.append(sep)
        i += 2 if sep else 1

    VOICES.write_text("".join(out), encoding="utf-8")
    print(f"Annotated {hits}/{len(LOOKUP)} dialogue instructs into {VOICES}")
    if missing:
        print("Unmatched dialogue cues:")
        for line in missing:
            print(" ", line)
    unused = [k for k in LOOKUP if k not in {norm_key(m.split(": ", 1)[-1]) for m in []}]
    # Show keys not used by checking file
    file_quotes = set()
    for m in re.finditer(r'^\[QwenInstruct\]', "".join(out), re.M):
        pass
    annotated = len(re.findall(r"^\[QwenInstruct\]", "".join(out), re.M))
    print(f"QwenInstruct lines present: {annotated}")


if __name__ == "__main__":
    main()
