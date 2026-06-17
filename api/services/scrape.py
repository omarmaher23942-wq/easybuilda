"""Lightweight website knowledge fetcher (httpx + BeautifulSoup). Best-effort; never raises."""
from __future__ import annotations

import logging
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

log = logging.getLogger("easybuilda.scrape")

_UA = "Mozilla/5.0 (compatible; EasyBuildaBot/1.0; +https://easybuilda.com)"
_MAX_PAGES = 4
_MAX_CHARS = 14000


def _clean_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg", "nav", "footer", "header", "form", "iframe"]):
        tag.decompose()
    return " ".join(soup.get_text(separator=" ", strip=True).split())


def _same_domain(base: str, link: str) -> bool:
    try:
        return urlparse(base).netloc == urlparse(link).netloc
    except Exception:  # noqa: BLE001
        return False


async def fetch_site_text(url: str) -> str:
    if not url:
        return ""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    pages = 0
    texts: list[str] = []
    to_visit: list[str] = [url]
    seen: set[str] = set()
    headers = {"User-Agent": _UA}

    try:
        async with httpx.AsyncClient(timeout=15, headers=headers, follow_redirects=True) as client:
            while to_visit and pages < _MAX_PAGES:
                current = to_visit.pop(0)
                if current in seen:
                    continue
                seen.add(current)
                try:
                    r = await client.get(current)
                    if r.status_code != 200 or "text/html" not in r.headers.get("content-type", ""):
                        continue
                    html = r.text
                except Exception as exc:  # noqa: BLE001
                    log.info("scrape skip %s (%s)", current, exc)
                    continue

                texts.append(_clean_html(html))
                pages += 1

                if pages == 1:
                    soup = BeautifulSoup(html, "html.parser")
                    for a in soup.find_all("a", href=True):
                        link = urljoin(current, a["href"]).split("#")[0]
                        if _same_domain(url, link) and link not in seen and link not in to_visit:
                            to_visit.append(link)
                        if len(to_visit) > 8:
                            break
    except Exception as exc:  # noqa: BLE001
        log.warning("scrape failed for %s: %s", url, exc)

    return "\n\n".join(t for t in texts if t)[:_MAX_CHARS]