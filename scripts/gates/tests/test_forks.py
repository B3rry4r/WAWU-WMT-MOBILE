"""The forks gate fails a local function component that copies a shared one (FIX-14).

It used to read only `class`, `enum`, `mixin`, `extension` and `interface`, so a
second `function ErrorState()` three files from the real one passed. A shared
component is one exported from `src/components/`; a copy is the same name declared
again anywhere else, exported or not. The same name in two feature files is two
local helpers, not a fork of anything shared.

    python3 -m unittest discover -s scripts/gates/tests
"""
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from run import Context, load_json, CONFIG_PATH  # noqa: E402
from checks import forks  # noqa: E402

CONFIG = load_json(CONFIG_PATH, {})

SHARED = "export function Avatar({ name }: { name: string }) {\n  return <View accessibilityLabel={name} />;\n}\n"


def findings(files: dict[str, str]) -> list:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        for rel, text in files.items():
            f = root / rel
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text(text, encoding="utf-8")
        ctx = Context(repo=root, config=CONFIG, gate_config=CONFIG["gates"]["forks"])
        return list(forks.run(ctx))


class FunctionComponentCopies(unittest.TestCase):
    def test_a_local_function_component_with_a_shared_name_fails(self):
        found = findings({
            "src/components/Avatar.tsx": SHARED,
            "src/features/me/Row.tsx": "function Avatar({ name }: { name: string }) {\n  return <Text>{name}</Text>;\n}\n",
        })
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0].severity, "fail")
        self.assertEqual(found[0].path, "src/features/me/Row.tsx")
        self.assertEqual(found[0].line, 1)
        self.assertIn("src/components/Avatar.tsx", found[0].message)

    def test_every_way_of_writing_a_component_is_caught(self):
        for copy in [
            "function Avatar() {\n  return null;\n}\n",
            "export function Avatar() {\n  return null;\n}\n",
            "export default function Avatar() {\n  return null;\n}\n",
            "function Avatar<T>(props: T) {\n  return null;\n}\n",
            "const Avatar = () => null;\n",
            "export const Avatar = (props: Props) => null;\n",
            "const Avatar = async (props: Props) => null;\n",
            "const Avatar = props => null;\n",
            "const Avatar: FC<{ onPress: () => void }> = () => null;\n",
            "const Avatar = memo(function Avatar() {\n  return null;\n});\n",
            "const Avatar = React.memo(() => null);\n",
            "const Avatar = forwardRef<View, Props>((props, ref) => null);\n",
            "const Avatar = forwardRef((props, ref) => null);\n",
        ]:
            with self.subTest(copy=copy):
                found = findings({"src/components/Avatar.tsx": SHARED, "src/features/me/Row.tsx": copy})
                self.assertEqual(len(found), 1, copy)
                self.assertEqual(found[0].path, "src/features/me/Row.tsx")

    def test_a_copy_inside_another_shared_file_fails_too(self):
        found = findings({
            "src/components/Avatar.tsx": SHARED,
            "src/components/ListRow.tsx": "function Avatar() {\n  return null;\n}\n",
        })
        self.assertEqual([f.path for f in found], ["src/components/ListRow.tsx"])

    def test_a_shared_component_in_a_subfolder_is_shared(self):
        found = findings({
            "src/components/pay-sheet/Failed.tsx": "export function Failed() {\n  return null;\n}\n",
            "src/features/me/Row.tsx": "function Failed() {\n  return null;\n}\n",
        })
        self.assertEqual(len(found), 1)

    def test_the_shared_component_alone_passes(self):
        self.assertEqual(findings({"src/components/Avatar.tsx": SHARED}), [])

    def test_importing_the_shared_component_passes(self):
        self.assertEqual(
            findings({
                "src/components/Avatar.tsx": SHARED,
                "src/features/me/Row.tsx": "import { Avatar } from '@/components';\nexport function Row() {\n  return <Avatar name=\"A\" />;\n}\n",
            }),
            [],
        )

    def test_the_same_name_in_two_feature_files_is_not_a_copy_of_a_shared_one(self):
        self.assertEqual(
            findings({
                "src/features/a/Screen.tsx": "function Loading() {\n  return null;\n}\n",
                "src/features/b/Screen.tsx": "function Loading() {\n  return null;\n}\n",
            }),
            [],
        )

    def test_a_platform_pair_is_one_file(self):
        self.assertEqual(
            findings({
                "src/components/Player.tsx": "export function Player() {\n  return null;\n}\n",
                "src/components/Player.web.tsx": "export function Player() {\n  return null;\n}\n",
            }),
            [],
        )

    def test_a_test_file_may_stub_a_shared_component(self):
        self.assertEqual(
            findings({
                "src/components/Avatar.tsx": SHARED,
                "src/features/me/__tests__/Row.test.tsx": "function Avatar() {\n  return null;\n}\n",
                "src/features/me/Row.test.tsx": "const Avatar = () => null;\n",
            }),
            [],
        )

    def test_a_lower_case_helper_and_a_plain_value_are_not_components(self):
        self.assertEqual(
            findings({
                "src/components/Avatar.tsx": SHARED,
                "src/features/me/Row.tsx": "function avatar() {\n  return null;\n}\nconst Avatar = 5;\nconst AvatarSize = () => 44;\ntype Avatar = string;\n",
            }),
            [],
        )

    def test_a_name_too_short_to_mean_anything_is_left_alone(self):
        self.assertEqual(
            findings({
                "src/components/Av.tsx": "export function Av() {\n  return null;\n}\n",
                "src/features/me/Row.tsx": "function Av() {\n  return null;\n}\n",
            }),
            [],
        )

    def test_the_class_check_still_works(self):
        found = findings({
            "src/api/a.ts": "export class ApiError extends Error {}\n",
            "src/api/b.ts": "export class ApiError extends Error {}\n",
        })
        self.assertEqual(len(found), 1)
        self.assertIn("ApiError", found[0].message)


if __name__ == "__main__":
    unittest.main()
