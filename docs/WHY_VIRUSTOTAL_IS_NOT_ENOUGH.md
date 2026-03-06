# Why VirusTotal (or a single scan) is not enough to trust a skill

When publishing or choosing OpenClaw/ClawHub skills, some workflows mention VirusTotal or similar scanners. Relying on them alone is not sufficient for trust. Here’s why.

---

## What VirusTotal does

- **Aggregates** many antivirus and URL scanners (60–70+ engines).
- Checks files/URLs against **known malware signatures** and heuristics.
- Reports “clean” when those engines don’t flag the sample.

---

## Why that’s not enough for skills

1. **Skills are not just files**  
   A skill is **instructions** (SKILL.md) plus optional **scripts**. Risk often comes from:
   - What the agent is **told to do** (e.g. “run this command”, “send data here”).
   - **Behavior** of scripts (e.g. calling an untrusted API, exfiltrating data).  
   Traditional AV looks for known malware patterns in binaries; it doesn’t interpret skill instructions or full script behavior.

2. **“Clean” ≠ safe**  
   A file can be “clean” on VirusTotal and still:
   - Tell the agent to run dangerous commands.
   - Send user data to a server you don’t trust.
   - Rely on social engineering (e.g. “download this ZIP” in the instructions).  
   Incidents like ClawHavoc showed that malicious skills can rely on instructions and one-time scripts, not only on detected malware.

3. **VirusTotal’s role**  
   VirusTotal is useful as a **supplementary** check (e.g. “is this script hash known-bad?”). It is not designed to answer “is this skill safe to run in my environment?”. That requires reading the skill’s endpoints, data flow, and trust statement.

---

## What to do instead

- Read the skill’s **External Endpoints**, **Security & Privacy**, and **Trust Statement** (and the code if possible).
- Prefer skills that declare exactly which URLs they call and what data is sent.
- Don’t treat a “clean” VirusTotal result as a guarantee that the skill is safe to use.
