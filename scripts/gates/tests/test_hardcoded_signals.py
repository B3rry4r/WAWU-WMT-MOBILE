"""Planted violations for the literal rules of the hardcoded_signals gate.

Every pattern the rule "colours, spacing and radii come from @/theme" forbids
must fail, and clean code must pass. Each case writes a throwaway source file
into a temporary repo and runs the real gate over it.

    python3 -m unittest discover -s scripts/gates/tests
"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from run import Context, load_json, CONFIG_PATH  # noqa: E402
from checks import hardcoded_signals  # noqa: E402

CONFIG = load_json(CONFIG_PATH, {})


def findings(files: dict) -> list:
    """Run the gate, with the repo's real config, over files {relpath: text}."""
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        for rel, text in files.items():
            f = root / rel
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text(text, encoding="utf-8")
        ctx = Context(repo=root, config=CONFIG, gate_config=CONFIG["gates"]["hardcoded_signals"])
        return list(hardcoded_signals.run(ctx))


def one(line: str, path: str = "src/ui/Probe.tsx") -> list:
    return findings({path: f"export const s = {{\n  {line}\n}};\n"})


class ColourLiterals(unittest.TestCase):
    def test_each_colour_form_fails(self):
        for line in [
            "color: '#fff',",
            "color: '#FFF',",
            "color: '#fffa',",
            "color: '#ff0000',",
            "color: '#ff000080',",
            "backgroundColor: '#12345678',",
            "borderColor: '#000',",
            "color: '#ffffff',",
            "shadowColor: '#0F0F12',",
            "backgroundColor: 'rgb(255, 0, 0)',",
            "backgroundColor: 'rgba(0,0,0,0.4)',",
            "backgroundColor: 'hsl(280 80% 40%)',",
            "backgroundColor: 'hsla(280, 80%, 40%, 0.5)',",
            "color: 'white',",
            "backgroundColor: \"black\",",
            "borderColor: 'rebeccapurple',",
            "tintColor: 'red',",
            "boxShadow: '0 2px 8px #0003',",
            "background: 'linear-gradient(#9411C9, #C368EA)',",
        ]:
            with self.subTest(line=line):
                found = one(line)
                self.assertTrue(found, f"gate passed a literal colour: {line}")
                self.assertTrue(all(f.severity == "fail" for f in found))
                self.assertTrue(any("raw colour" in f.message for f in found))

    def test_colours_from_the_theme_pass(self):
        for line in [
            "color: colors.text,",
            "backgroundColor: colors.surface,",
            "backgroundColor: 'transparent',",
            "borderColor: colors.border,",
            "label: 'Item #123',",
            "title: 'white label partners',",
            "tintColor: colors.accent,",
        ]:
            with self.subTest(line=line):
                self.assertEqual(one(line), [], line)


class SpacingLiterals(unittest.TestCase):
    def test_each_spacing_key_fails(self):
        for line in [
            "padding: 13,",
            "paddingHorizontal: 20,",
            "paddingVertical: 7,",
            "paddingTop: 3,",
            "paddingLeft: 5.5,",
            "margin: 10,",
            "marginBottom: 12,",
            "marginStart: 4,",
            "marginTop: -8,",
            "gap: 6,",
            "rowGap: 6,",
            "columnGap: 6,",
            "borderRadius: 7,",
            "borderTopLeftRadius: 9,",
            "borderBottomEndRadius: 9,",
            "borderRadius: 7 }",
        ]:
            with self.subTest(line=line):
                found = one(line)
                self.assertTrue(found, f"gate passed a literal spacing: {line}")
                self.assertTrue(any("literal" in f.message for f in found))

    def test_jsx_prop_literal_fails(self):
        found = findings({"src/ui/P.tsx": "export const A = () => <Stack gap={8} />;\n"})
        self.assertTrue(found)

    def test_theme_values_and_zero_pass(self):
        for line in [
            "padding: space.lg,",
            "paddingHorizontal: layout.gutter,",
            "gap: space[2],",
            "borderRadius: radius.card,",
            "margin: 0,",
            "marginTop: 0,",
            "padding: 0.0,",
            "borderRadius: radius.card + 2,",
            "width: 24,",
            "height: 56,",
            "borderWidth: 1,",
            "fontSize: 16,",
        ]:
            with self.subTest(line=line):
                self.assertEqual(one(line), [], line)

    def test_type_declarations_pass(self):
        self.assertEqual(findings({"src/ui/T.ts": "type S = { padding?: number; gap: number };\n"}), [])


class Allowed(unittest.TestCase):
    def test_token_layer_is_allowed(self):
        self.assertEqual(findings({"src/theme/index.ts": "export const x = { color: '#fff', padding: 13 };\n"}), [])

    def test_generated_tokens_and_tests_are_not_scanned(self):
        files = {
            "src/theme/tokens.generated.ts": "export const a = { color: '#fff', padding: 13 };\n",
            "src/__tests__/x.test.tsx": "const s = { color: '#fff', padding: 13 };\n",
            "src/ui/__tests__/y.ts": "const s = { color: 'white', gap: 3 };\n",
        }
        self.assertEqual(findings(files), [])

    def test_clean_component_passes(self):
        clean = (
            "import { StyleSheet, View } from 'react-native';\n"
            "import { space, radius } from '@/theme';\n"
            "export const styles = StyleSheet.create({\n"
            "  card: { padding: space.lg, borderRadius: radius.card, gap: space.sm, margin: 0 },\n"
            "});\n"
            "export const A = () => <View style={styles.card} />;\n"
        )
        self.assertEqual(findings({"src/ui/Clean.tsx": clean}), [])

    def test_comments_are_not_flagged(self):
        self.assertEqual(findings({"src/ui/C.ts": "// padding: 13 and #fff are fine in a comment\n"}), [])


if __name__ == "__main__":
    unittest.main()
