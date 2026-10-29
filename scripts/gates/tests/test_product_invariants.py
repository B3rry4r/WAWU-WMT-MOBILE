"""The R-1 rule ("Flutterwave is never named to users") and its one exception (BILLS-09, R-102).

The bills checkout loads Flutterwave's own page, so its address is one string in `src/features/bills/checkoutPage.ts`. The rule's
`allow_paths` lets exactly that file hold the word. Everything else is unchanged: the word is still banned in every other file, the
other rules still fire inside the allowed file, and a path that only looks like it (another folder, another extension, a neighbour)
is not allowed. Each case writes a throwaway source into a temporary repo and runs the real gate with the repo's real config.

    python3 -m unittest discover -s scripts/gates/tests
"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from run import Context, load_json, CONFIG_PATH  # noqa: E402
from checks import product_invariants  # noqa: E402

CONFIG = load_json(CONFIG_PATH, {})
ALLOWED = "src/features/bills/checkoutPage.ts"
ORIGIN = "export const CHECKOUT_ORIGIN = 'https://checkout.flutterwave.com';\n"


def check(files: dict) -> list:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        for rel, text in files.items():
            f = root / rel
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text(text, encoding="utf-8")
        ctx = Context(repo=root, config=CONFIG, gate_config=CONFIG["gates"]["product_invariants"])
        return list(product_invariants.run(ctx))


def r1(found: list) -> list:
    return [f for f in found if "[R-1]" in f.message]


class FlutterwaveAllowance(unittest.TestCase):
    def test_the_config_names_the_exception_and_its_ruling(self):
        rule = next(r for r in CONFIG["gates"]["product_invariants"]["banned"] if r["pattern"] == "flutterwave")
        self.assertEqual(rule["allow_paths"], [ALLOWED])
        self.assertEqual(rule["allow_ruling"], "R-102")
        self.assertTrue(rule["allow_why"].strip())
        self.assertEqual(rule["ruling"], "R-1")

    def test_the_checkout_file_may_hold_the_address(self):
        self.assertEqual(check({ALLOWED: ORIGIN}), [])

    def test_the_word_is_still_banned_in_every_other_file(self):
        for rel in (
            "src/features/bills/checkoutPage.tsx",
            "src/features/bills/other.ts",
            "src/features/bills/sub/checkoutPage.ts",
            "src/features/bills/CheckoutModal.tsx",
            "src/features/wallet/Screen.tsx",
            "src/api/client.ts",
        ):
            with self.subTest(rel=rel):
                self.assertEqual(len(r1(check({rel: ORIGIN}))), 1)

    def test_the_word_is_banned_in_copy_anywhere_else(self):
        found = check({"src/features/bills/Screen.tsx": "export const S = () => <Text>Pay with Flutterwave</Text>;\n"})
        self.assertEqual(len(r1(found)), 1)
        found = check({"src/features/bills/words.ts": "export const W = \"Paid by Flutterwave\";\n"})
        self.assertEqual(len(r1(found)), 1)

    def test_the_other_rules_still_fire_inside_the_allowed_file(self):
        found = check({ALLOWED: ORIGIN + "export const T = 'Pay now — quickly';\nexport const U = 'a free trial';\n"})
        self.assertEqual(r1(found), [])
        rulings = sorted(f.message.split("]")[0] + "]" for f in found)
        self.assertEqual(rulings, ["[PO-2026-09-01]", "[PO-2026-09-21]"])

    def test_the_allowance_is_the_file_and_not_a_prefix_or_a_glob(self):
        self.assertEqual(len(r1(check({"src/features/bills/checkoutPage.ts.bak.ts": ORIGIN}))), 1)
        self.assertEqual(len(r1(check({"src/features/billsX/checkoutPage.ts": ORIGIN}))), 1)

    def test_the_real_repo_passes_with_the_origin_written_plain(self):
        source = (Path(__file__).resolve().parents[3] / ALLOWED).read_text(encoding="utf-8")
        self.assertIn("'https://checkout.flutterwave.com'", source)
        self.assertNotIn("flutter' +", source)


if __name__ == "__main__":
    unittest.main()
