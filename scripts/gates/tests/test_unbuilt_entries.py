"""Planted entries for the unbuilt_entries gate (DECISIONS R-46).

An inert entry is `onPress={unbuilt('<TASK-ID>')}`. The gate must fail one whose
task does not exist, one whose task is built (review or done), and one whose
argument is not a single string literal; it must pass the rest, and list what
is still inert by task. Each case writes throwaway task files and sources into
a temporary repo and runs the real gate, with the repo's real config, over it.

    python3 -m unittest discover -s scripts/gates/tests
"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from run import Context, load_json, discover, CONFIG_PATH, REPO  # noqa: E402
from checks import unbuilt_entries  # noqa: E402

CONFIG = load_json(CONFIG_PATH, {})

TASK = "---\nid: {id}\ntitle: {title}\nowner: YOU\nstatus: {status}\n---\n# {id}\n"


def check(tasks: dict, files: dict, extra_task_files: dict | None = None) -> list:
    """Run the gate over a temporary repo. tasks: {id: status}; files: {relpath: source}."""
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "tasks").mkdir()
        for tid, status in tasks.items():
            (root / "tasks" / f"{tid}.md").write_text(
                TASK.format(id=tid, title=f"Title of {tid}", status=status), encoding="utf-8"
            )
        for name, text in (extra_task_files or {}).items():
            (root / "tasks" / name).write_text(text, encoding="utf-8")
        for rel, text in files.items():
            f = root / rel
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text(text, encoding="utf-8")
        ctx = Context(repo=root, config=CONFIG, gate_config=CONFIG["gates"]["unbuilt_entries"])
        return list(unbuilt_entries.run(ctx))


def screen(body: str, path: str = "src/features/me/Screen.tsx") -> dict:
    return {path: f"export const S = () => (\n  <Row title=\"x\" {body} />\n);\n"}


def fails(found: list) -> list:
    return [f for f in found if f.severity == "fail"]


def warns(found: list) -> list:
    return [f for f in found if f.severity == "warn"]


class Passes(unittest.TestCase):
    def test_every_in_progress_status_may_stay_inert(self):
        for status in ["todo", "building", "verifying"]:
            with self.subTest(status=status):
                found = check({"ME-03": status}, screen("onPress={unbuilt('ME-03')}"))
                self.assertEqual(fails(found), [])
                self.assertEqual(len(warns(found)), 1)

    def test_each_literal_form_passes(self):
        for arg in ["'ME-03'", '"ME-03"', "`ME-03`", "'ME-03',", "  'ME-03'  ", "\n    'ME-03',\n  "]:
            with self.subTest(arg=arg):
                found = check({"ME-03": "todo"}, screen(f"onPress={{unbuilt({arg})}}"))
                self.assertEqual(fails(found), [], arg)
                self.assertEqual(len(warns(found)), 1, arg)

    def test_no_calls_prints_nothing(self):
        self.assertEqual(check({"ME-03": "todo"}, screen("onPress={() => go()}")), [])

    def test_a_task_that_is_not_built_beside_one_that_is_still_passes_the_first(self):
        found = check(
            {"ME-03": "todo", "ME-04": "done"},
            {"src/a.tsx": "const a = unbuilt('ME-03');\n", "src/b.tsx": "const b = unbuilt('ME-04');\n"},
        )
        self.assertEqual([f.path for f in fails(found)], ["src/b.tsx"])
        self.assertEqual(len(warns(found)), 1)

    def test_the_helper_declaration_is_not_a_call(self):
        src = (
            "export type TaskId = string;\n"
            "export function unbuilt(task: TaskId): () => void;\n"
            "export function unbuilt (task: TaskId) { return () => undefined; }\n"
            "function* unbuilt(task) {}\n"
        )
        self.assertEqual(check({}, {"src/lib/unbuilt.ts": src}), [])

    def test_a_name_that_only_ends_in_unbuilt_is_another_function(self):
        src = "const a = isunbuilt('x');\nconst b = $unbuilt(y);\nconst c = notunbuilt(1, 2);\n"
        self.assertEqual(check({}, {"src/a.ts": src}), [])

    def test_test_files_are_not_scanned(self):
        src = "unbuilt('NOPE-1'); unbuilt(id);\n"
        for path in ["src/__tests__/x.test.ts", "src/features/me/Screen.test.tsx", "src/lib/__tests__/u.ts"]:
            with self.subTest(path=path):
                self.assertEqual(check({}, {path: src}), [])


class Comments(unittest.TestCase):
    def test_a_call_in_a_comment_or_a_string_is_not_a_call(self):
        for src in [
            "// onPress={unbuilt('NOPE-1')}\n",
            "const a = 1; // unbuilt(id)\n",
            "/* unbuilt('NOPE-1') */\n",
            "/**\n * Use unbuilt('NOPE-1') on the row.\n * Or unbuilt(id).\n */\nconst a = 1;\n",
            "const s = \"call unbuilt('NOPE-1') here\";\n",
            "const s = 'call unbuilt(id) here';\n",
            "const s = `call unbuilt(id) here`;\n",
        ]:
            with self.subTest(src=src):
                self.assertEqual(check({}, {"src/a.ts": src}), [], src)

    def test_a_slash_slash_inside_a_string_does_not_hide_a_later_call(self):
        src = "const a = <Link href=\"https://x.test\" onPress={unbuilt('NOPE-1')} />;\n"
        found = fails(check({}, {"src/a.tsx": src}))
        self.assertEqual(len(found), 1)
        self.assertIn("NOPE-1", found[0].message)

    def test_an_apostrophe_in_jsx_text_does_not_hide_a_later_call(self):
        src = "const a = <Row><Text>Don't</Text><Tap onPress={unbuilt('NOPE-1')} /></Row>;\n"
        found = fails(check({}, {"src/a.tsx": src}))
        self.assertEqual(len(found), 1)
        self.assertIn("NOPE-1", found[0].message)

    def test_a_call_after_a_block_comment_on_the_same_line_is_found(self):
        found = fails(check({}, {"src/a.tsx": "const a = /* row */ unbuilt('NOPE-1');\n"}))
        self.assertEqual(len(found), 1)

    def test_a_call_inside_a_template_expression_is_found(self):
        found = fails(check({}, {"src/a.tsx": "const a = `x ${unbuilt('NOPE-1')} y`;\n"}))
        self.assertEqual(len(found), 1)


class UnknownTask(unittest.TestCase):
    def test_an_id_with_no_task_file_fails_and_names_it(self):
        found = fails(check({"ME-03": "todo"}, screen("onPress={unbuilt('ME-99')}")))
        self.assertEqual(len(found), 1)
        self.assertIn("ME-99", found[0].message)
        self.assertIn("no task file", found[0].message)

    def test_a_misspelt_id_fails(self):
        for arg in ["'me-03'", "'ME-3'", "'ME03'", "'ME-03 '", "''", "'ME-03.md'"]:
            with self.subTest(arg=arg):
                found = fails(check({"ME-03": "todo"}, screen(f"onPress={{unbuilt({arg})}}")))
                self.assertEqual(len(found), 1, arg)

    def test_no_tasks_directory_at_all_fails_every_call(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "src").mkdir()
            (root / "src" / "a.tsx").write_text("const a = unbuilt('ME-03');\n", encoding="utf-8")
            ctx = Context(repo=root, config=CONFIG, gate_config={})
            found = list(unbuilt_entries.run(ctx))
        self.assertEqual(len(fails(found)), 1)

    def test_the_template_and_the_index_are_not_tasks(self):
        template = TASK.format(id="X-00", title="t", status="todo")
        found = fails(check(
            {}, {"src/a.tsx": "const a = unbuilt('X-00');\n"},
            extra_task_files={"TEMPLATE.md": template, "INDEX.md": template},
        ))
        self.assertEqual(len(found), 1)

    def test_a_file_without_front_matter_is_not_a_task(self):
        found = fails(check(
            {}, {"src/a.tsx": "const a = unbuilt('ME-03');\n"},
            extra_task_files={"ME-03.md": "# ME-03\nno front matter\n"},
        ))
        self.assertEqual(len(found), 1)

    def test_the_id_comes_from_the_front_matter(self):
        text = TASK.format(id="ME-07", title="t", status="todo")
        found = check({}, {"src/a.tsx": "const a = unbuilt('ME-07');\n"}, extra_task_files={"anything.md": text})
        self.assertEqual(fails(found), [])


class BuiltTask(unittest.TestCase):
    def test_review_fails(self):
        found = fails(check({"ME-03": "review"}, screen("onPress={unbuilt('ME-03')}")))
        self.assertEqual(len(found), 1)
        self.assertIn("ME-03", found[0].message)
        self.assertIn("review", found[0].message)
        self.assertIn("so its screen is built", found[0].message)

    def test_done_fails(self):
        found = fails(check({"ME-03": "done"}, screen("onPress={unbuilt('ME-03')}")))
        self.assertEqual(len(found), 1)
        self.assertIn("done", found[0].message)
        self.assertIn("so its screen is built", found[0].message)

    def test_every_call_of_a_built_task_fails_in_every_file(self):
        found = fails(check(
            {"ME-03": "done"},
            {
                "src/a.tsx": "const a = unbuilt('ME-03');\nconst b = unbuilt('ME-03');\n",
                "src/app/b.tsx": "const c = unbuilt('ME-03');\n",
            },
        ))
        self.assertEqual(len(found), 3)

    def test_a_status_the_gate_does_not_know_fails_rather_than_passes(self):
        for status in ["", "ready", "Done", "todo | building"]:
            with self.subTest(status=status):
                found = fails(check({"ME-03": status}, screen("onPress={unbuilt('ME-03')}")))
                self.assertEqual(len(found), 1, status)


class NotOneLiteral(unittest.TestCase):
    def test_each_non_literal_argument_fails(self):
        for arg in [
            "id",
            "ids.me",
            "TASK",
            "'ME-' + '03'",
            "`ME-${n}`",
            "cond ? 'ME-03' : 'ME-04'",
            "'ME-03', 'ME-04'",
            "'ME-03' as TaskId",
            "...ids",
            "'ME-03' + ''",
            "",
            "String('ME-03')",
            "'ME-03'.trim()",
            "`ME-03${''}`",
        ]:
            with self.subTest(arg=arg):
                found = fails(check({"ME-03": "todo", "ME-04": "todo"}, screen(f"onPress={{unbuilt({arg})}}")))
                self.assertEqual(len(found), 1, arg)
                self.assertIn("string literal", found[0].message)

    def test_a_non_literal_fails_even_when_every_task_is_in_progress(self):
        found = check({"ME-03": "todo"}, {"src/a.tsx": "const a = unbuilt(id);\nconst b = unbuilt('ME-03');\n"})
        self.assertEqual(len(fails(found)), 1)
        self.assertEqual(fails(found)[0].line, 1)
        self.assertEqual(len(warns(found)), 1)

    def test_an_unterminated_string_fails(self):
        self.assertEqual(len(fails(check({"ME-03": "todo"}, {"src/a.tsx": "const a = unbuilt('ME-03);\n"}))), 1)


class Listing(unittest.TestCase):
    FILES = {
        "src/features/me/Hub.tsx": "a(unbuilt('ME-03'));\nb(unbuilt('ME-03'));\nc(unbuilt('WALLET-05'));\n",
        "src/features/home/Home.tsx": "d(unbuilt('ME-03'));\n",
        "src/app/x.tsx": "\n\ne(unbuilt('SCHOOLS-03'));\n",
    }
    TASKS = {"ME-03": "todo", "WALLET-05": "building", "SCHOOLS-03": "verifying", "ME-04": "todo"}

    def test_one_line_per_task_with_the_count_and_every_site(self):
        found = check(self.TASKS, self.FILES)
        self.assertEqual(fails(found), [])
        listed = warns(found)
        self.assertEqual([f.message.split(" ")[0] for f in listed], ["ME-03", "SCHOOLS-03", "WALLET-05"])
        me = listed[0]
        self.assertIn("3 inert entries", me.message)
        self.assertIn("(todo)", me.message)
        self.assertIn("src/features/me/Hub.tsx (2)", me.message)
        self.assertIn("src/features/home/Home.tsx (1)", me.message)
        self.assertEqual(
            sorted(me.evidence.split(", ")),
            ["src/features/home/Home.tsx:1", "src/features/me/Hub.tsx:1", "src/features/me/Hub.tsx:2"],
        )
        self.assertIn("1 inert entry in", listed[2].message)

    def test_a_task_nothing_names_is_not_listed(self):
        names = " ".join(f.message for f in warns(check(self.TASKS, self.FILES)))
        self.assertNotIn("ME-04", names)

    def test_the_title_is_shown_so_a_reader_knows_who_wires_it(self):
        found = warns(check({"ME-03": "todo"}, {"src/a.tsx": "x(unbuilt('ME-03'));\n"}))
        self.assertIn("Title of ME-03", found[0].message)

    def test_findings_carry_the_call_line(self):
        found = fails(check({}, {"src/a.tsx": "const a = 1;\n\n\n  x(unbuilt('NOPE-1'));\n"}))
        self.assertEqual((found[0].path, found[0].line), ("src/a.tsx", 4))
        self.assertIn("unbuilt('NOPE-1')", found[0].evidence)


class Registered(unittest.TestCase):
    def test_the_gate_is_on_by_default(self):
        self.assertTrue(CONFIG["gates"]["unbuilt_entries"].get("enabled"))
        self.assertIn("unbuilt_entries", [name for name, _ in discover(CONFIG, None)])

    def test_run_py_can_load_and_run_it(self):
        # Exit 2 means the harness itself is broken (unknown gate, no module).
        run = subprocess.run(
            [sys.executable, str(REPO / "scripts" / "gates" / "run.py"), "--gate", "unbuilt_entries", "--json"],
            cwd=REPO, capture_output=True, text=True,
        )
        self.assertIn(run.returncode, (0, 1), run.stdout + run.stderr)
        self.assertEqual(set(json.loads(run.stdout)), {"failures", "warnings", "accepted"})


if __name__ == "__main__":
    unittest.main()
