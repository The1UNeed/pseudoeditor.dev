#!/usr/bin/env python3
"""Audit rendered SEO without browser JavaScript. Run against a production build.

python3 scripts/audit-seo.py --base-url http://localhost:3000 --output /tmp/seo.json
Canonical URLs always refer to the public site, even when testing localhost.
"""

import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET


SITE = "https://www.pseudoeditor.dev"
AGENT = "PseudoEditor-SEO-Audit/1.0"


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.titles = []
        self.meta = {}
        self.links = {}
        self.h1s = 0
        self.lang = None
        self.json_ld = []
        self.text = []
        self.capture = None
        self.hidden_text_tag = None
        self.buffer = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.lang = attrs.get("lang")
        elif tag == "meta":
            key = attrs.get("name", attrs.get("property"))
            self.meta.setdefault(key, []).append(attrs.get("content", ""))
        elif tag == "link":
            key = (attrs.get("rel"), attrs.get("hreflang"))
            self.links.setdefault(key, []).append(attrs.get("href"))
        elif tag == "h1":
            self.h1s += 1
        if tag in ("script", "style"):
            self.hidden_text_tag = tag
        if tag == "title" or (tag == "script" and attrs.get("type") == "application/ld+json"):
            self.capture = tag
            self.buffer = []

    def handle_data(self, data):
        if self.capture:
            self.buffer.append(data)
        elif not self.hidden_text_tag:
            self.text.append(data)

    def handle_endtag(self, tag):
        if tag == self.capture:
            value = "".join(self.buffer).strip()
            (self.titles if tag == "title" else self.json_ld).append(value)
            self.capture = None
        if tag == self.hidden_text_tag:
            self.hidden_text_tag = None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=SITE)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    base = args.base_url.rstrip("/")

    def fetch(path, agent=AGENT):
        request = Request(base + path, headers={"User-Agent": agent})
        try:
            with urlopen(request, timeout=30) as response:
                return response.status, response.read().decode(), response.geturl(), response.headers
        except HTTPError as error:
            return error.code, error.read().decode(), error.geturl(), error.headers

    status, xml, _, _ = fetch("/sitemap.xml")
    if status != 200:
        raise RuntimeError(f"sitemap.xml returned {status}")
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "x": "http://www.w3.org/1999/xhtml"}
    rows = ET.fromstring(xml).findall("s:url", ns)
    urls = [row.findtext("s:loc", namespaces=ns) for row in rows]
    if not urls or any(url is None or urlsplit(url).scheme != "https" or urlsplit(url).netloc != urlsplit(SITE).netloc for url in urls):
        raise RuntimeError("Sitemap must contain public canonical URLs")
    status, robots_text, _, _ = fetch("/robots.txt")
    robots = RobotFileParser()
    robots.parse(robots_text.splitlines())
    bots = ["Googlebot", "bingbot", "OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"]
    global_findings = []
    if status != 200:
        global_findings.append(f"robots.txt returned {status}")
    if robots.site_maps() != [SITE + "/sitemap.xml"]:
        global_findings.append("robots.txt does not reference the canonical sitemap")
    if len(set(urls)) != len(urls):
        global_findings.append("Duplicate sitemap URLs")

    def audit(row):
        url = row.findtext("s:loc", namespaces=ns)
        path = urlsplit(url).path or "/"
        chinese = path == "/zh" or path.startswith("/zh/")
        bare_path = (path[3:] or "/") if chinese else path
        alternates = {"en": SITE + ("" if bare_path == "/" else bare_path),
                      "zh-CN": SITE + "/zh" + ("" if bare_path == "/" else bare_path)}
        alternates["x-default"] = alternates["en"]
        findings = []
        try:
            status, html, final_url, headers = fetch(path)
            page = Page(html)
            if status != 200:
                findings.append(f"HTTP {status}")
            if urlsplit(final_url).path != path:
                findings.append(f"Sitemap URL redirects to {final_url}")
            if len(page.titles) != 1 or not page.titles[0]:
                findings.append("Expected one nonempty title")
            description = page.meta.get("description", [])
            if len(description) != 1 or not description[0]:
                findings.append("Expected one nonempty description")
            if page.lang != ("zh-CN" if chinese else "en"):
                findings.append("Incorrect document language")
            if page.links.get(("canonical", None)) != [url]:
                findings.append("Missing or incorrect canonical")
            for language, target in alternates.items():
                if page.links.get(("alternate", language)) != [target]:
                    findings.append(f"Incorrect {language} page alternate")
            sitemap_alternates = {link.get("hreflang"): link.get("href") for link in row.findall("x:link", ns)}
            if sitemap_alternates != alternates:
                findings.append("Incorrect sitemap language alternates")
            for key, expected in {"og:url": [url], "og:title": page.titles,
                                  "og:description": description, "twitter:title": page.titles,
                                  "twitter:description": description}.items():
                if not expected or page.meta.get(key) != expected:
                    findings.append(f"Missing or inconsistent {key}")
            if not page.meta.get("og:image") or not page.meta.get("twitter:image"):
                findings.append("Missing social image")
            directives = " ".join(page.meta.get("robots", []) + page.meta.get("googlebot", []))
            directives += " " + headers.get("X-Robots-Tag", "")
            if any(value in directives.lower() for value in ["noindex", "none", "nosnippet"]):
                findings.append("Indexing or snippets blocked")
            for bot in bots:
                if not robots.can_fetch(bot, url):
                    findings.append(f"Blocked for {bot}")
            # The interactive editor has a toolbar rather than an article heading.
            if bare_path != "/app" and page.h1s != 1:
                findings.append(f"Expected one H1, found {page.h1s}")
            structured_types = []
            for raw in page.json_ld:
                try:
                    data = json.loads(raw)
                    for item in data if isinstance(data, list) else [data]:
                        kind = item.get("@type", [])
                        structured_types.extend(kind if isinstance(kind, list) else [kind])
                        if item.get("@type") == "FAQPage":
                            text = " ".join(" ".join(page.text).split())
                            for question in item.get("mainEntity", []):
                                for value in [question["name"], question["acceptedAnswer"]["text"]]:
                                    if " ".join(value.split()) not in text:
                                        findings.append("FAQ structured data differs from rendered text")
                except (ValueError, AttributeError):
                    findings.append("Invalid JSON-LD")
            return {"url": url, "status": status, "title": page.titles,
                    "description": description, "structured_types": structured_types, "findings": findings}
        except Exception as error:
            return {"url": url, "findings": [f"Fetch/parse failed: {error}"]}

    with ThreadPoolExecutor(max_workers=8) as pool:
        pages = list(pool.map(audit, rows))
    for field in ["title", "description"]:
        counts = Counter(page[field][0] for page in pages if page.get(field))
        for value, count in counts.items():
            if count > 1:
                global_findings.append(f"Duplicate {field} on {count} pages: {value}")
    for bot in bots:
        status, _, _, _ = fetch("/", bot)
        if status != 200:
            global_findings.append(f"Homepage returned {status} for {bot}")
    for locale in ["", "/zh"]:
        for route in ["/login", "/callback", "/logout"]:
            path = locale + route
            status, html, _, headers = fetch(path)
            page = Page(html)
            directives = " ".join(page.meta.get("robots", [])) + " " + headers.get("X-Robots-Tag", "")
            if status != 200 or "noindex" not in directives.lower():
                global_findings.append(f"Expected a noindex auth page: {path}, HTTP {status}")
            if any("index" in directive.split(", ") for directive in page.meta.get("googlebot", [])):
                global_findings.append(f"Conflicting Googlebot index directive: {path}")
            if SITE + path in urls:
                global_findings.append(f"Auth page included in sitemap: {path}")
    for path, expected_type in [("/opengraph-image", "image/"), ("/icon.png", "image/")]:
        # Images are binary; inspect the response without decoding it as HTML.
        with urlopen(Request(base + path, headers={"User-Agent": AGENT}), timeout=30) as response:
            if response.status != 200 or not response.headers.get("Content-Type", "").startswith(expected_type):
                global_findings.append(f"Invalid social/icon image: {path}")
    report = {"checked_at": datetime.now(timezone.utc).isoformat(), "base_url": base,
              "sitemap_urls": len(urls), "pages_passed": sum(not page["findings"] for page in pages),
              "findings_count": len(global_findings) + sum(len(page["findings"]) for page in pages),
              "global_findings": global_findings, "pages": pages,
              "traffic_impact": "Unmeasured. This audit measures technical eligibility, not traffic, rankings, or AI citations."}
    with open(args.output, "w") as output:
        json.dump(report, output, ensure_ascii=False, indent=2)
        output.write("\n")
    print(f"{report['pages_passed']}/{len(urls)} pages passed; {report['findings_count']} findings. Report: {args.output}")
    for finding in global_findings:
        print(f"GLOBAL: {finding}")
    for page in pages:
        for finding in page["findings"]:
            print(f"{page['url']}: {finding}")
    raise SystemExit(1 if report["findings_count"] else 0)


if __name__ == "__main__":
    main()
