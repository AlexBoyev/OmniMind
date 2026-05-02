import subprocess
import sys
import os
import json
import time
import shutil
import argparse
from pathlib import Path
from datetime import datetime

STATE_FILE = Path.home() / ".ai-dev-state.json"
CWD = Path.cwd()
CLAUDE_MD = CWD / "CLAUDE.md"
COLLAB_MD = CWD / "collab.md"
DOTENV = CWD / ".env"
COOLDOWN = 4 * 3600


def p(msg=""):
    sys.stdout.write(str(msg) + "\n")
    sys.stdout.flush()


def load_dotenv():
    if not DOTENV.exists():
        return
    try:
        text = DOTENV.read_text(encoding="utf-8", errors="ignore")
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val
    except Exception as e:
        p("warn: could not read .env: " + str(e))


def get_aider_cmd():
    if shutil.which("aider"):
        return ["aider"]
    try:
        r = subprocess.run(
            [sys.executable, "-m", "aider", "--version"],
            capture_output=True,
            timeout=5
        )
        if r.returncode == 0:
            return [sys.executable, "-m", "aider"]
    except Exception:
        pass
    return None


def aider_ok():
    return get_aider_cmd() is not None


def make_claude(model):
    def build(pr, f):
        return ["claude", "--model", model, "-p", pr]
    return build


def make_aider(model, editor=None):
    def build(pr, f):
        base = get_aider_cmd()
        if not base:
            p("  aider not found. Run: pip install aider-chat")
            sys.exit(1)
        cmd = base + ["--model", model]
        if editor:
            cmd += ["--editor-model", editor]
        cmd += ["--cache-prompts", "--auto-commits", "--yes"]
        cmd += list(f)
        cmd += ["--message", pr]
        return cmd
    return build


TOOLS = {
    "claude-opus": {
        "name": "Claude Code (Opus)",
        "binary": "claude",
        "free": False,
        "build": make_claude("claude-opus-4-7"),
    },
    "claude-sonnet": {
        "name": "Claude Code (Sonnet)",
        "binary": "claude",
        "free": False,
        "build": make_claude("claude-sonnet-4-6"),
    },
    "aider-gemini": {
        "name": "Aider + Gemini 2.5 Pro (free)",
        "binary": "aider",
        "free": True,
        "env": "GEMINI_API_KEY",
        "build": make_aider("gemini/gemini-2.5-pro-exp-03-25", "gemini/gemini-flash-1.5"),
    },
    "aider-qwen": {
        "name": "Aider + Qwen3 Coder 480B (free)",
        "binary": "aider",
        "free": True,
        "env": "OPENROUTER_API_KEY",
        "build": make_aider("openrouter/qwen/qwen3-coder-480b:free"),
    },
    "aider-deepseek": {
        "name": "Aider + DeepSeek R1 (free)",
        "binary": "aider",
        "free": True,
        "env": "OPENROUTER_API_KEY",
        "build": make_aider("openrouter/deepseek/deepseek-r1:free"),
    },
}

MODE_MAP = {
    "hard": "claude-opus",
    "daily": "claude-sonnet",
    "cheap": "aider-gemini",
    "review": "aider-gemini",
    "fast": "aider-qwen",
}

FREE_ORDER = ["aider-gemini", "aider-qwen", "aider-deepseek"]


def load_state():
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"claude_burned_at": None, "free_index": 0}


def save_state(s):
    try:
        STATE_FILE.write_text(json.dumps(s, indent=2), encoding="utf-8")
    except Exception:
        pass


def claude_ready():
    s = load_state()
    burned = s.get("claude_burned_at")
    if not burned:
        return True
    remaining = COOLDOWN - (time.time() - burned)
    if remaining <= 0:
        s["claude_burned_at"] = None
        save_state(s)
        return True
    h = int(remaining // 3600)
    m = int((remaining % 3600) // 60)
    p("  Claude cooling -- " + str(h) + "h " + str(m) + "m remaining")
    return False


def burn_claude():
    s = load_state()
    s["claude_burned_at"] = time.time()
    save_state(s)
    p("  Claude marked as cooling (4h). Switching to free model.")


def reset_claude():
    s = load_state()
    s["claude_burned_at"] = None
    save_state(s)
    p("  Claude cooldown cleared.")


def tool_ok(tid):
    t = TOOLS.get(tid)
    if not t:
        return False
    if t["binary"] == "aider":
        if not aider_ok():
            return False
    else:
        if not shutil.which(t["binary"]):
            return False
    env_key = t.get("env")
    if env_key and not os.environ.get(env_key):
        return False
    return True


def auto_pick():
    if claude_ready() and tool_ok("claude-sonnet"):
        return "claude-sonnet"
    free = [tid for tid in FREE_ORDER if tool_ok(tid)]
    if not free:
        p("  No tools ready. Run: python ai-dev.py --setup")
        sys.exit(1)
    s = load_state()
    idx = s.get("free_index", 0) % len(free)
    chosen = free[idx]
    s["free_index"] = (idx + 1) % len(free)
    save_state(s)
    return chosen


def update_claude_md(prompt, tool_name, mode, files):
    try:
        lines = [
            "",
            "## Last session (" + datetime.now().strftime("%Y-%m-%d %H:%M") + ")",
            "- Mode: " + str(mode or "auto"),
            "- Tool: " + str(tool_name),
            "- Task: " + prompt[:120],
        ]
        if files:
            lines.append("- Files: " + ", ".join(files))
        note = "\n".join(lines) + "\n"
        with open(CLAUDE_MD, "a", encoding="utf-8") as fh:
            fh.write(note)
    except Exception:
        pass


def run_tool(tid, prompt, files, mode=None, silent=False):
    tool = TOOLS[tid]
    if not silent:
        p()
        p("  Using: " + tool["name"])
        p("  Task:  " + prompt[:80] + ("..." if len(prompt) > 80 else ""))
        p()
    cmd = tool["build"](prompt, list(files))
    try:
        result = subprocess.run(cmd)
        if result.returncode != 0 and not tool["free"]:
            p("  Claude errored -- switching to free fallback.")
            burn_claude()
            fallback = auto_pick()
            run_tool(fallback, prompt, files, mode)
            return
        update_claude_md(prompt, tool["name"], mode, list(files))
    except FileNotFoundError:
        p("  Binary not found: " + tool["binary"])
        p("  Run: python ai-dev.py --setup")
        sys.exit(1)
    except KeyboardInterrupt:
        p("  Stopped.")


def run_review_chain(prompt, files):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    p("  Starting 3-model review chain...")
    p()

    content = (
        "# collab.md -- " + ts + "\n\n"
        "## Task\n" + prompt + "\n\n"
        "## Definition of Done\n"
        "- [ ] Implementation complete\n"
        "- [ ] Tests pass\n"
        "- [ ] Error cases handled\n"
        "- [ ] No breaking changes\n\n"
        "## Model_1: Claude -- Implementation\n_Pending..._\n\n"
        "## Model_2: Gemini -- Primary Review\n_Pending..._\n\n"
        "## Model_3: Qwen3 -- Secondary Review\n_Pending..._\n\n"
        "## Status: IN PROGRESS\n"
    )
    COLLAB_MD.write_text(content, encoding="utf-8")
    collab = ["collab.md"]

    p("  Step 1/3: Claude implements")
    p1 = (
        prompt + "\n\n"
        "After completing, update collab.md under "
        "'## Model_1: Claude -- Implementation' with: "
        "files changed, what was done, how to verify, known gaps."
    )
    writer = "claude-sonnet" if (claude_ready() and tool_ok("claude-sonnet")) else auto_pick()
    run_tool(writer, p1, list(files) + collab, mode="review-chain", silent=True)

    p("  Step 2/3: Gemini reviews")
    p2 = (
        "Read collab.md. Do a HARSH review of Model_1 implementation. "
        "Find bugs, missing error handling, edge cases, security issues. "
        "Update collab.md under '## Model_2: Gemini -- Primary Review' "
        "with BLOCKERS, WARNINGS, and PASSES."
    )
    if tool_ok("aider-gemini"):
        run_tool("aider-gemini", p2, collab, mode="review-chain", silent=True)
    else:
        p("  Gemini not available -- add GEMINI_API_KEY to .env")

    p("  Step 3/3: Qwen3 integration check")
    p3 = (
        "Read collab.md. Check integration issues, missing pieces, completeness. "
        "Update '## Model_3: Qwen3 -- Secondary Review'. "
        "Set Status to READY TO MERGE or NEEDS FIXES."
    )
    if tool_ok("aider-qwen"):
        run_tool("aider-qwen", p3, collab, mode="review-chain", silent=True)
    else:
        p("  Qwen3 not available -- add OPENROUTER_API_KEY to .env")

    p()
    p("  Review chain complete. See collab.md for results.")
    p()
    try:
        p(COLLAB_MD.read_text(encoding="utf-8")[:2000])
    except Exception:
        pass


def show_status():
    s = load_state()
    burned = s.get("claude_burned_at")
    aider_installed = aider_ok()
    aider_cmd = get_aider_cmd()

    p()
    p("  ============================================")
    p("  ai-dev  |  Rotation Status")
    p("  ============================================")
    p()

    for tid in TOOLS:
        t = TOOLS[tid]
        ok = tool_ok(tid)
        if not t["free"]:
            if not ok:
                status = "NOT INSTALLED"
            elif burned:
                rem = max(0, COOLDOWN - (time.time() - burned))
                h = int(rem // 3600)
                m = int((rem % 3600) // 60)
                status = "COOLING -- " + str(h) + "h " + str(m) + "m left"
            else:
                status = "READY"
        else:
            if ok:
                status = "READY (free)"
            elif not aider_installed:
                status = "MISSING aider -- pip install aider-chat"
            elif t.get("env") and not os.environ.get(t["env"]):
                status = "MISSING KEY -- add " + t["env"] + " to .env"
            else:
                status = "NOT READY"
        line = "  " + t["name"]
        while len(line) < 46:
            line += " "
        p(line + status)

    p()
    if DOTENV.exists():
        p("  .env    : FOUND at " + str(DOTENV))
    else:
        p("  .env    : NOT FOUND -- create .env in " + str(CWD))

    if aider_cmd:
        p("  aider   : " + " ".join(aider_cmd))
    else:
        p("  aider   : NOT FOUND -- pip install aider-chat")

    p("  state   : " + str(STATE_FILE))

    free_list = [tid for tid in FREE_ORDER if tool_ok(tid)]
    if claude_ready() and tool_ok("claude-sonnet"):
        next_tid = "claude-sonnet"
    elif free_list:
        next_tid = free_list[0]
    else:
        next_tid = None

    p("  next    : " + (TOOLS[next_tid]["name"] if next_tid else "none -- check setup"))
    p()
    p("  Modes:")
    p("    --mode hard         Claude Opus      new features, architecture")
    p("    --mode daily        Claude Sonnet    bug fixes, tests, configs")
    p("    --mode cheap        Gemini free      file reads, exploration")
    p("    --mode fast         Qwen3 free       boilerplate, docstrings")
    p("    --mode review       Gemini free      code review")
    p("    --review-chain      3-model write + review workflow")
    p()


def show_setup():
    p()
    p("  ============================================")
    p("  ai-dev  |  Setup Guide")
    p("  ============================================")
    p()
    p("  1. Install Aider:")
    p("       pip install aider-chat")
    p()
    p("  2. Get FREE API keys:")
    p("       Gemini:     https://aistudio.google.com  -> Get API Key")
    p("       OpenRouter: https://openrouter.ai        -> Keys -> Create Key")
    p()
    p("  3. Add to your .env file:")
    p("       GEMINI_API_KEY=AIza...")
    p("       OPENROUTER_API_KEY=sk-or-v1-...")
    p()
    p("  4. Test: python ai-dev.py --status")
    p()
    p("  Usage examples:")
    p('    python ai-dev.py "add rate limiting to auth routes"')
    p('    python ai-dev.py --mode daily "fix Redis timeout"')
    p('    python ai-dev.py --mode cheap "explain UserService" src\\services\\user.py')
    p('    python ai-dev.py --mode fast "write docstrings" src\\utils\\helpers.py')
    p('    python ai-dev.py --review-chain "add webhook" src\\api\\webhooks.py')
    p()


def main():
    load_dotenv()

    parser = argparse.ArgumentParser(
        prog="ai-dev",
        description="Smart AI CLI rotation wrapper"
    )
    parser.add_argument("prompt", nargs="?", help="Your development prompt")
    parser.add_argument("files", nargs="*", help="Files for Aider context")
    parser.add_argument("--mode", choices=["hard", "daily", "cheap", "review", "fast"])
    parser.add_argument("--review-chain", dest="review_chain", action="store_true")
    parser.add_argument("--force", metavar="TOOL_ID")
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--setup", action="store_true")
    parser.add_argument("--burned", action="store_true")
    parser.add_argument("--reset", action="store_true")

    args = parser.parse_args()

    if args.status:
        show_status()
        return
    if args.setup:
        show_setup()
        return
    if args.burned:
        burn_claude()
        return
    if args.reset:
        reset_claude()
        return
    if not args.prompt:
        parser.print_help()
        sys.stdout.flush()
        return

    files = args.files or []

    if args.review_chain:
        run_review_chain(args.prompt, files)
        return

    if args.force:
        if args.force not in TOOLS:
            p("  Unknown tool: " + args.force)
            p("  Valid IDs: " + ", ".join(TOOLS.keys()))
            sys.exit(1)
        run_tool(args.force, args.prompt, files, mode=args.force)
        return

    if args.mode:
        tid = MODE_MAP[args.mode]
        if not TOOLS[tid]["free"] and not claude_ready():
            p("  " + TOOLS[tid]["name"] + " is cooling -- using free fallback.")
            tid = auto_pick()
        run_tool(tid, args.prompt, files, mode=args.mode)
        return

    tid = auto_pick()
    run_tool(tid, args.prompt, files)


if __name__ == "__main__":
    main()