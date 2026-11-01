"""Regression checks for the HTML parser used by audit-seo.py."""

from pathlib import Path
import runpy
import unittest


Page = runpy.run_path(str(Path(__file__).with_name("audit-seo.py")))["Page"]


class PageTests(unittest.TestCase):
    def test_ignores_hydration_scripts_and_styles_but_preserves_json_ld(self):
        page = Page('''<title>Compiler</title>
            <script>self.__next_f.push([1, "Missing FAQ answer"])</script>
            <style>.example::before { content: "Missing FAQ answer"; }</style>
            <script type="application/ld+json">{"answer":"Missing FAQ answer"}</script>
            <details><summary>Visible question?</summary>Visible answer.</details>''')
        self.assertNotIn("Missing FAQ answer", " ".join(page.text))
        self.assertIn("Visible question?", " ".join(page.text))
        self.assertIn("Visible answer.", " ".join(page.text))
        self.assertEqual(page.titles, ["Compiler"])
        self.assertEqual(page.json_ld, ['{"answer":"Missing FAQ answer"}'])


if __name__ == "__main__":
    unittest.main()
