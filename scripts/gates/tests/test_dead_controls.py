"""The dead_controls gate still fails an empty handler, and an inert entry is not one.

An entry drawn with the R-47 helper, `onPress={unbuilt('<TASK>')}` (kept, unused),
is checked by unbuilt_entries, not here; an empty handler written by hand is
still a defect.

    python3 -m unittest discover -s scripts/gates/tests
"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from run import Context, load_json, CONFIG_PATH  # noqa: E402
from checks import dead_controls  # noqa: E402

CONFIG = load_json(CONFIG_PATH, {})


def findings(line: str) -> list:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        f = root / "src" / "features" / "me" / "Screen.tsx"
        f.parent.mkdir(parents=True)
        f.write_text(f"export const S = () => (\n  <Row title=\"x\" {line} />\n);\n", encoding="utf-8")
        ctx = Context(repo=root, config=CONFIG, gate_config=CONFIG["gates"]["dead_controls"])
        return list(dead_controls.run(ctx))


class EmptyHandlers(unittest.TestCase):
    def test_an_empty_handler_fails(self):
        for line in [
            "onPress={() => {}}",
            "onPress={async () => {}}",
            "onPress={(e) => {}}",
            "onPress={() => null}",
            "onPress={() => undefined}",
            "onPress={noop}",
            "onPress={undefined}",
        ]:
            with self.subTest(line=line):
                found = findings(line)
                self.assertEqual(len(found), 1, line)
                self.assertEqual(found[0].severity, "fail")

    def test_an_unbuilt_entry_is_not_a_dead_control(self):
        self.assertEqual(findings("onPress={unbuilt('ME-03')}"), [])

    def test_a_real_handler_passes(self):
        self.assertEqual(findings("onPress={() => router.push('/me')}"), [])


if __name__ == "__main__":
    unittest.main()
