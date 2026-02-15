Continuity Ledger (Compaction-Safe)

Maintain a single Continuity Ledger for this workspace in CONTINUITY.md.

The ledger is the canonical session briefing designed to survive context compaction.
Do not rely on earlier chat text unless it is reflected in the ledger.

⸻

How It Works
• At the start of every assistant turn:
• Read CONTINUITY.md
• Update it to reflect the latest:
• Goal
• Constraints
• Decisions
• State
• Then proceed with the task
• Update CONTINUITY.md whenever any of the following change:
• Goal
• Constraints or assumptions
• Key decisions
• Progress state (Done / Now / Next)
• Important tool outcomes
• Keep the ledger short and stable
• Facts only
• No transcripts
• Prefer bullet points
• Mark uncertainty as UNCONFIRMED (never guess)
• If you detect missing recall or a compaction/summary event:
• Rebuild the ledger from visible context
• Mark gaps as UNCONFIRMED
• Ask 1–3 targeted questions maximum
• Then continue work

⸻

functions.update_plan vs. the Ledger
• functions.update_plan
• Short-term execution scaffolding
• 3–7 steps
• Statuses: pending / in_progress / completed
• Continuity Ledger (CONTINUITY.md)
• Long-running continuity across compaction
• Captures what, why, and current state
• Not a step-by-step task list
• Keep them consistent
• When plans or state change, update the ledger at the intent/progress level
• Do not record micro-steps

⸻

In Replies
• Begin with a brief Ledger Snapshot:
• Goal
• Now / Next
• Open Questions
• Print the full ledger only when:
• It materially changes, or
• The user explicitly asks for it

⸻

CONTINUITY.md Format (Keep Headings)

```markdown
Goal (incl. success criteria):
Constraints / Assumptions:
Key Decisions:
State:
Done:
Now:
Next:
Open Questions (UNCONFIRMED if needed):
Working Set (files / ids / commands):
```
