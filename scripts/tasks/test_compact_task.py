"""Tests for compact_task.py and the Current state rule in check_tasks.py.

    python3 -m unittest discover -s scripts/tasks -q
"""
import sys
import unittest
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_tasks  # noqa: E402
import compact_task  # noqa: E402

TASK = """---
id: X-01
title: A task
---
# X-01 · A task

## Read first

- docs

## Lead note (8 Oct 2026)

A brief-level ruling that must stay.

## Capability checks

- [ ] A user can do it.

## Builder report

Round one.

## Verifier report

Found a thing.

## Lead merge note (9 Oct 2026)

Merged.

## Builder report, round 2

Fixed it.

## Owner sign-off

_Owner: date._
"""


class CompactTest(unittest.TestCase):
    def test_moves_the_rounds_and_keeps_the_brief(self):
        new, moved, headings = compact_task.compact(TASK, "X-01")
        self.assertIn("A brief-level ruling that must stay.", new)
        self.assertIn("## Capability checks", new)
        self.assertIn("## Owner sign-off", new)
        self.assertNotIn("Round one.", new)
        self.assertEqual(headings, ["## Builder report", "## Verifier report",
                                    "## Lead merge note (9 Oct 2026)", "## Builder report, round 2"])
        self.assertIn("(history/X-01.md)", new)

    def test_every_line_is_kept_somewhere(self):
        new, moved, _ = compact_task.compact(TASK, "X-01")
        lost = Counter(TASK.splitlines()) - Counter(new.splitlines()) - Counter(moved.splitlines())
        self.assertEqual(sum(lost.values()), 0, lost)

    def test_running_twice_moves_nothing_more(self):
        new, _, _ = compact_task.compact(TASK, "X-01")
        again, moved, headings = compact_task.compact(new, "X-01")
        self.assertEqual((again, moved, headings), (new, "", []))

    def test_an_unfilled_template_has_nothing_to_move(self):
        text = TASK.split("## Builder report")[0] + "## Builder report\n\n_Filled in by the builder._\n\n## Verifier report\n\n_Not started._\n"
        self.assertEqual(compact_task.compact(text, "X-01")[1], "")

    def test_a_placeholder_current_state_is_added_once(self):
        new, added = compact_task.ensure_state(TASK)
        self.assertTrue(added)
        self.assertIn("## Current state", new)
        self.assertEqual(compact_task.ensure_state(new), (new, False))


class CurrentStateTest(unittest.TestCase):
    def test_reads_only_its_own_section(self):
        body = "# T\n\n## Current state\n\na\nb\n\n## Read first\n\nc\n"
        self.assertEqual(check_tasks.current_state(body), ["## Current state", "", "a", "b"])

    def test_none_when_absent(self):
        self.assertIsNone(check_tasks.current_state("# T\n\n## Goal\n\nx\n"))


if __name__ == "__main__":
    unittest.main()
