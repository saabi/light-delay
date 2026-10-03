# Studio Write — human acceptance checklist

Run this against the **exact candidate** for integration into `master`, before that merge. It tests the Write workflow on PostgreSQL the way an author uses it.

There are two kinds of result:

- **Gates (G).** Must pass. Any failure blocks the merge into `master`, above all any loss of typed or committed text.
- **Observations (O).** Exploratory notes on feel, wording and polish. They never block; they feed later work.

When something fails, the fix goes onto `implementation/m2-authoring` through a reviewed PR. Then re-run the affected gates on the new candidate. The integration PR itself never carries fixes.

## 0. Record the candidate

```sh
git fetch origin
git switch --detach origin/implementation/m2-authoring
git rev-parse HEAD            # write this SHA in the record sheet
```

Also note the browser (with version), operating system and window size.

## 1. Run Studio locally on PostgreSQL

Requirements: Node from `.nvmrc` (24), npm, and PostgreSQL 16. Docker is the simplest way to get PostgreSQL, and makes stopping it in G9–G10 a single command.

```sh
npm ci

# A throwaway local database; these credentials are for this machine only.
docker run --name studio-accept -e POSTGRES_USER=studio -e POSTGRES_PASSWORD=studio \
  -e POSTGRES_DB=studio_accept -p 5432:5432 -d postgres:16
export DATABASE_URL=postgresql://studio:studio@127.0.0.1:5432/studio_accept

npm run migrate:studio        # applies 001 and 002; safe to rerun
npm run build:studio
STUDIO_AUTHORING_STORE=postgres PORT=5180 node apps/studio/build/index.js
```

Open <http://127.0.0.1:5180>. To start again from the fixture, stop Studio, run `docker rm -f studio-accept`, and repeat the block from `docker run`.

Without Docker, use a local PostgreSQL 16 with an empty database. To stop and start it, use your service manager or `pg_ctl`.

## 2. Gates

Unless a gate says otherwise, each one starts from the Feature cut in a normal window at 100% text size.

**G1. Opening.**
- The page opens to the screenplay in Courier.
- The bar shows the Studio identity, the breadcrumb with the Feature cut, and the save state.
- No error appears and nothing flickers into place.

**G2. Writing continuously.**
- Click at the end of the dialogue and press Enter: an action starts.
- Type a paragraph long enough to wrap. Nothing is clipped, scrolls inside an element, or shows a grip.
- Use Enter, Tab and Shift+Tab to create each of the six types: scene heading, action, character, parenthetical, dialogue, transition.
- Ctrl/⌘+Alt+1…6 set each type directly.

**G3. Editing across elements.**
- Select from inside one element to inside another and type over the selection.
- Undo restores both elements exactly; redo repeats the change.
- Paste three lines of plain text: you get three elements.
- Alt+↑/↓ moves the current element.
- The handle beside the current element opens the element menu, and so do Shift+F10 and the context-menu key. Move, Type and Remove all work, and Escape returns to the text.

**G4. Autosave.**
- Type and pause: the save state goes from *Saving…* to *Saved*.
- Reload: the text is there exactly.
- No action ever asks you to save.

**G5. Cuts.**
- Edit Feature, then switch to Trailer with the cut menu: Trailer is unaffected.
- Switch back: your Feature edit is still there.

**G6. Commit.**
- Make several edits: revise words, add an element, remove one, move one.
- *Commit changes* shows them inline: inserted text underlined, removed text struck, and Added / Removed / Moved labels in the margin. The page does not jump.
- Write a note and press Enter: *Committed* shows briefly.
- History lists the note, with the change summary under it.
- Reload: everything persists.

**G7. History and restore.**
- In History, the current version has no restore action, and an earlier one shows *Preview*.
- Preview shows that version's text and asks before restoring.
- Restore with a note: *Restored*. A new History entry appears and nothing is deleted; the version you replaced can still be previewed and restored.

**G8. Changing an element's type after commit.**
- Commit a change, then turn a committed dialogue into an action.
- The commit review shows a removed dialogue and an added action.
- Cancel, change it back to dialogue, and confirm there is nothing to commit for that element any more.

**G9. Database outage while typing.**
1. Stop PostgreSQL: `docker stop studio-accept`.
2. Type. The save state shows *Reconnecting…*, then **Offline — kept on this device — Retry**.
3. Close the tab. It does not ask before leaving.
4. Start PostgreSQL (`docker start studio-accept`) and reopen Studio.

Expected: the text you typed is there and becomes *Saved*. Nothing typed is lost at any point.

**G10. Database outage around a commit.**
1. Prepare a commit and open the commit card.
2. Stop PostgreSQL and press Commit: a failure shows with Retry.
3. Start PostgreSQL and press Retry.

Expected: exactly one new History entry, no duplicate, and the text is as reviewed.

**G11. Two tabs, one offline.** Open Studio in tabs A and B.
1. In A's DevTools → Network, choose *Offline*. Type in A until it shows *Offline — kept on this device*.
2. In B, edit the same dialogue differently and wait for *Saved*.
3. Close A, then open a new tab.

Expected:
- the new tab shows *Text kept on this device* with A's text marked against B's saved text;
- *Restore it* brings A's text back and saves it;
- repeat the scenario: *Discard it* keeps B's text, and the card does not come back after a reload;
- while A is still open, a new tab never takes over A's text.

**G12. Server restart.** Stop and restart the Node process while the page is open and has unsaved typing. The page recovers (Retry if offered), the typing is saved, and nothing is lost.

**G13. Readability.**
- In the *Aa* panel, text size 100–200%, contrast, line spacing and interface font all apply at once, and persist after a reload.
- The screenplay keeps Courier and single spacing.
- *Reset to defaults* restores everything.

**G14. Small and large.**
- At phone width (DevTools device mode, about 390 px) and at 200% text, Write is fully usable: no horizontal scrolling, every element's full text visible, and the bar's actions reachable.
- Commit and History work there.

**G15. Keyboard only.** Repeat G2 and G6 without the mouse. Focus is always visible, including the outline on the current element.

## 3. Observations

Note anything that feels slow, unclear or wrong, even if it passes. Suggested probes:

- **O1.** Writing a full scene for ten minutes: rhythm of Enter and Tab, element types, capitalisation of character names and transitions.
- **O2.** Pasting a long scene (several pages): responsiveness and autosave.
- **O3.** Wording of save states, commit, review and history.
- **O4.** Inline review readability on long rewrites (word-level marks).
- **O5.** Anything you expected to find and could not.

## 4. Record sheet

Copy this into the integration PR or a review note.

```text
Candidate SHA:
Browser / OS / window:
Date, tester:

| Gate | Pass/Fail | Notes |
| G1   |           |       |
| G2   |           |       |
| G3   |           |       |
| G4   |           |       |
| G5   |           |       |
| G6   |           |       |
| G7   |           |       |
| G8   |           |       |
| G9   |           |       |
| G10  |           |       |
| G11  |           |       |
| G12  |           |       |
| G13  |           |       |
| G14  |           |       |
| G15  |           |       |

Observations:
- O…
```
