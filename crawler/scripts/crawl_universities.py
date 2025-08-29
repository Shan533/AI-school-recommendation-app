#!/usr/bin/env python3
"""
University Crawler Script
Crawls QS world university rankings and stores rows in unreviewed tables (Supabase)

Priority:
1) Direct fetch QS .txt via --qs-main-url / --qs-indicators-url (recommended)
2) Discover .txt from HTML and external JS files
3) Fallback: embedded JSON, JSON-LD, link/table heuristics

Storage:
- Uses SupabaseManager.enrich_or_insert_unreviewed_school(fill_only_empty=True)
  to insert new rows or partially update existing unreviewed_schools rows.
"""

import asyncio
import sys
import random
from typing import Optional, Dict, Any, List, Tuple
from loguru import logger

from crawler.config.settings import settings
from crawler.storage.supabase_manager import supabase_manager


# -------------------- small helpers --------------------

def _strip_html_to_text(s: Optional[str]) -> str:
    """Safely strip tags from short HTML snippets."""
    if not s or not isinstance(s, str):
        return ""
    try:
        from bs4 import BeautifulSoup
        return BeautifulSoup(s, "html.parser").get_text(" ", strip=True)
    except Exception:
        return s.replace("<div>", "").replace("</div>", "").replace("<span>", "").replace("</span>", "").strip()


def _to_float_or_none(val: Any) -> Optional[float]:
    """Convert numeric-like strings ('97.3%', '1,234') to float if possible."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    s = _strip_html_to_text(str(val))
    s = s.replace(",", "").replace("%", "").strip()
    try:
        return float(s)
    except Exception:
        return None


class UniversityCrawler:
    """Specialized crawler for QS ranking data"""

    def __init__(self,
                 start_url: Optional[str] = None,
                 qs_main_url: Optional[str] = None,
                 qs_indicators_url: Optional[str] = None):
        # A public ranking page (used for discovery/fallback)
        self.ranking_url = start_url or "https://www.qschina.cn/en/university-rankings/world-university-rankings/2026"
        # Direct endpoints (most reliable if you already captured them)
        self.qs_main_url = qs_main_url
        self.qs_indicators_url = qs_indicators_url

        self.stored_count = 0
        self.enriched_count = 0
        self.skipped_count = 0

        # Non-school patterns to filter out obvious non-institution texts
        self.non_school_patterns = [
            "rankings", "ranking", "top global", "top universities", "world university",
            "qs world", "times higher", "academic ranking", "university guide",
            "best universities", "higher education", "education guide", "study guide",
            "academic excellence", "global education", "education ranking",
            "advertisement", "sponsored", "promoted", "click here", "learn more",
        ]

        # School keywords: English + common multilingual roots/variants
        self.school_keywords = [
            # English
            "university", "college", "institute", "academy", "school",
            "polytechnic", "conservatory", "seminary", "university college",
            # Romance/Germanic roots
            "univers", "universi", "universit",  # root to cover many variants
            "universidad", "universidade", "université", "università",
            "universität", "universiteit", "universitat", "universitas",
            "universitet", "facultad", "faculdade", "école", "ecole", "institut",
            # Slavic (latinized, common)
            "univerzita", "universytet",
            # East Asia
            "大学", "大學", "学院", "學院",          # zh
            "대학교", "대학", "학교",               # ko
            "大学院",                               # zh/ja usage
        ]

        # Ad attributes (rarely needed here, but kept for safety)
        self.ad_attributes = [
            'data-ad', 'data-advertisement', 'data-sponsored', 'data-promoted',
            'class*="ad"', 'class*="advertisement"', 'class*="sponsored"',
            'id*="ad"', 'id*="advertisement"', 'id*="sponsored"'
        ]

    # -------------------- main flow --------------------

    async def crawl_university_rankings(self, limit: int = 50, max_pages: int = 3) -> bool:
        logger.info("🎓 Starting University Rankings Crawler")
        logger.info(f"🎯 Target page: {self.ranking_url}")
        if self.qs_main_url:
            logger.info(f"🔗 QS main URL: {self.qs_main_url}")
        if self.qs_indicators_url:
            logger.info(f"🔗 QS indicators URL: {self.qs_indicators_url}")
        logger.info(f"📊 Limit (total): {limit}, Max pages: {max_pages}")

        job_id = None
        try:
            job_id = await supabase_manager.create_crawler_job(
                "university_rankings_crawl",
                {
                    "source": self._source_domain(self.ranking_url),
                    "limit": limit,
                    "max_pages": max_pages,
                    "qs_main_url": self.qs_main_url or "",
                }
            )
            logger.info(f"📝 Created crawler job: {job_id}")

            all_universities: List[Dict[str, Any]] = []

            # 1) Direct .txt fetch (best)
            if self.qs_main_url:
                direct_rows = await self._fetch_qs_txt_direct(
                    self.qs_main_url, self.qs_indicators_url, self.ranking_url
                )
                logger.info(f"✅ Direct .txt fetch: got {len(direct_rows)} rows")
                all_universities.extend(direct_rows)
            else:
                # 2) Discover .txt (HTML + external JS)
                discovered = await self._extract_university_list_from_page(self.ranking_url, limit)
                logger.info(f"✅ Discovery: got {len(discovered)} rows")
                all_universities.extend(discovered)

            if not all_universities:
                logger.error("❌ No universities found")
                await supabase_manager.update_crawler_job(job_id, status="failed", stats={
                    "total_items": 0, "successful_items": 0, "failed_items": 0, "pages_crawled": 0
                })
                return False

            processed = 0
            for i, uni in enumerate(all_universities, 1):
                if processed >= limit:
                    break

                name = (uni.get("name") or "").strip()
                logger.info(f"Progress: {i}/{len(all_universities)} - {name or 'Unknown'}")

                if not name or not self._is_valid_school_name(name):
                    logger.warning(f"⚠️ Skip invalid name: '{name}'")
                    continue

                try:
                    row_id, action = await supabase_manager.enrich_or_insert_unreviewed_school({
                        "name": name,
                        "initial": uni.get("initial") or name[:3].upper(),
                        "type": uni.get("type") or "University",
                        "country": uni.get("country"),
                        "location": uni.get("location", ""),
                        "year_founded": uni.get("year_founded"),
                        # pass raw qs_ranking; SupabaseManager will normalize ('=9' -> 9, '1201-1400' -> 1201)
                        "qs_ranking": uni.get("qs_ranking"),
                        "website_url": uni.get("website") or "",
                        "source_url": uni.get("source_url", self.ranking_url),
                        "confidence_score": uni.get("confidence_score", 0.9),
                        "raw_data": uni.get("raw_data", {}),
                        "status": "pending",
                    }, fill_only_empty=True)

                    if row_id:
                        if action == "inserted":
                            self.stored_count += 1
                            processed += 1
                            logger.info(f"✅ Inserted: {name} (ID: {row_id})")
                        elif action == "enriched":
                            self.enriched_count += 1
                            processed += 1
                            logger.info(f"🧩 Enriched (filled missing): {name} (ID: {row_id})")
                        else:
                            self.skipped_count += 1
                            logger.info(f"⏭️ Skipped (no missing fields to fill): {name} (ID: {row_id})")
                    else:
                        logger.warning(f"⚠️ Failed to upsert: {name}")

                    await asyncio.sleep(random.uniform(1.0, 2.0))
                except Exception as e:
                    logger.error(f"❌ Error storing '{name}': {e}")

            await supabase_manager.update_crawler_job(job_id, status="completed", stats={
                "total_items": processed,
                "successful_items": self.stored_count + self.enriched_count,
                "failed_items": max(0, processed - (self.stored_count + self.enriched_count)),
                "pages_crawled": 1
            })
            logger.info(
                f"🎯 Done: inserted={self.stored_count}, enriched={self.enriched_count}, skipped={self.skipped_count}"
            )
            return True

        except Exception as e:
            logger.error(f"❌ Crawler failed: {e}")
            if job_id:
                await supabase_manager.update_crawler_job(job_id, status="failed")
            return False

    # -------------------- direct .txt fetch --------------------

    async def _fetch_qs_txt_direct(self, main_url: str, indicators_url: Optional[str], referer: str) -> List[Dict[str, Any]]:
        """
        Fetch QS JSON payloads directly from their .txt endpoints.
        """
        import httpx
        import json
        from urllib.parse import urlparse, urljoin

        async def _fetch_json(url: str) -> Optional[Any]:
            async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT, follow_redirects=True) as client:
                r = await client.get(url, headers={
                    "User-Agent": settings.USER_AGENT,
                    "Referer": referer,
                    "Accept": "application/json, text/plain, */*",
                    "Accept-Language": "en-US,en;q=0.9,zh;q=0.8",
                })
                if r.status_code != 200:
                    logger.error(f"❌ Fetch failed {r.status_code}: {url}")
                    return None
                try:
                    return r.json()
                except Exception:
                    try:
                        return json.loads(r.text)
                    except Exception:
                        return None

        main = await _fetch_json(main_url)
        if not main:
            return []

        indicators = None
        if indicators_url:
            indicators = await _fetch_json(indicators_url)

        rows = main.get("data", main) if isinstance(main, dict) else main
        if not isinstance(rows, list):
            return []

        origin = f"{urlparse(referer).scheme}://{urlparse(referer).netloc}"
        results: List[Dict[str, Any]] = []

        for it in rows:
            raw_title = it.get("title") or it.get("name") or ""
            name = _strip_html_to_text(raw_title)
            if not name:
                continue

            # Extract profile link if present in HTML title
            profile_href = None
            try:
                from bs4 import BeautifulSoup
                a = BeautifulSoup(raw_title, "html.parser").find("a", href=True)
                if a and a.get("href"):
                    profile_href = a["href"]
            except Exception:
                pass

            website = ""
            if profile_href:
                website = profile_href if profile_href.startswith("http") else urljoin(origin, profile_href)

            # Leave qs_ranking raw; SupabaseManager will normalize/clean it safely
            rank_raw = it.get("rank_display") or it.get("overall_rank") or it.get("rank")

            overall = it.get("overall") or it.get("score") or ""
            overall_score = _to_float_or_none(overall)

            country = it.get("country") or it.get("country_name") or ""
            location = it.get("city") or it.get("location") or ""

            # Collect numeric indicators (ind_* keys)
            indicator_values = {}
            for k, v in it.items():
                if isinstance(k, str) and k.startswith("ind_"):
                    indicator_values[k] = _to_float_or_none(v)

            results.append({
                "name": name,
                "initial": name[:3].upper(),
                "type": "University",
                "country": country,
                "location": location,
                "year_founded": it.get("founded") or it.get("year_founded"),
                "qs_ranking": rank_raw,
                "website": website,
                "source_url": referer,
                "confidence_score": 0.95,
                "raw_data": {
                    "row": it,
                    "overall_score": overall_score,
                    "indicators": indicator_values,
                    "logo": it.get("logo"),
                    "region": it.get("region"),
                    "nid": it.get("nid"),
                    "core_id": it.get("core_id"),
                }
            })

        return results

    # -------------------- discover .txt from page --------------------

    async def _extract_university_list_from_page(self, page_url: str, want: int) -> List[Dict[str, Any]]:
        """
        Fetch the HTML page, try discovering .txt endpoints from HTML and external JS.
        If found, fetch those JSONs and return normalized rows.
        """
        import httpx
        from bs4 import BeautifulSoup

        async with httpx.AsyncClient(
            timeout=settings.REQUEST_TIMEOUT,
            headers={
                "User-Agent": settings.USER_AGENT,
                "Accept-Language": "en-US,en;q=0.9,zh;q=0.8",
            },
            follow_redirects=True
        ) as client:
            logger.info(f"🔍 Fetching page: {page_url}")
            r = await client.get(page_url)
            if r.status_code != 200:
                logger.error(f"❌ Failed to fetch page: {r.status_code}")
                return []

            html = r.text
            soup = BeautifulSoup(html, "html.parser")

            # A) Search for .txt in the HTML itself
            pairs = self._discover_qs_txt_pairs_in_text(html, page_url)
            logger.debug(f"🧩 HTML-discovered .txt pairs: {len(pairs)}")

            # B) If not found, scan external JS
            if not pairs:
                script_srcs = [s.get("src") for s in soup.find_all("script", src=True)]
                pairs = await self._discover_qs_txt_pairs_in_external_js(script_srcs, page_url, client)
                logger.debug(f"🧩 External-JS-discovered .txt pairs: {len(pairs)}")

            if not pairs:
                logger.warning("⚠️ No .txt endpoints discovered from page and scripts")
                return []

            # take first pair (main is required; indicators optional)
            (main_url, indicators_url) = pairs[0]
            logger.info(f"🔗 Using .txt: main={main_url} indicators={indicators_url or '(none)'}")

            return await self._fetch_qs_txt_direct(main_url, indicators_url, page_url)

    def _discover_qs_txt_pairs_in_text(self, text: str, page_url: str) -> List[Tuple[str, Optional[str]]]:
        """
        Find main/indicators .txt URLs in text, group by hash, and output pairs.
        Supports absolute/relative URLs and optional query strings (cache busters).
        """
        import re
        from urllib.parse import urljoin, urlparse

        origin = f"{urlparse(page_url).scheme}://{urlparse(page_url).netloc}"

        pat = re.compile(
            r'(?P<url>(?:https?://[^\s"\'<>]+|/[^"\'>]+)/sites/default/files/qs-rankings-data(?:/[a-z-]+)?/(?P<hash>[a-f0-9]{32})(?P<ind>_indicators)?\.txt(?:\?[^"\'>\s]*)?)',
            re.I
        )
        hits = list(pat.finditer(text))
        if not hits:
            return []

        by_hash: Dict[str, Dict[str, str]] = {}
        for m in hits:
            u = m.group("url")
            h = m.group("hash")
            is_ind = bool(m.group("ind"))
            full = u if u.startswith("http") else urljoin(origin, u)
            full = full.strip()
            bucket = by_hash.setdefault(h, {})
            if is_ind:
                bucket["ind"] = full
            else:
                bucket["main"] = full

        pairs: List[Tuple[str, Optional[str]]] = []
        for _, bk in by_hash.items():
            if "main" in bk:
                pairs.append((bk["main"], bk.get("ind")))
        return pairs

    async def _discover_qs_txt_pairs_in_external_js(self, script_srcs: List[str], page_url: str, client) -> List[Tuple[str, Optional[str]]]:
        """
        Fetch up to 15 external JS files (<=2MB each), search for .txt endpoints, group by hash.
        """
        from urllib.parse import urljoin, urlparse

        origin = f"{urlparse(page_url).scheme}://{urlparse(page_url).netloc}"

        # normalize/unique
        srcs = []
        seen = set()
        for s in script_srcs:
            if not s:
                continue
            full = s if s.startswith("http") else urljoin(origin, s)
            if full not in seen:
                seen.add(full)
                srcs.append(full)

        srcs = srcs[:15]
        logger.info(f"🧠 Scanning external JS files: {len(srcs)} candidates")

        all_pairs: List[Tuple[str, Optional[str]]] = []
        for idx, js_url in enumerate(srcs, 1):
            try:
                r = await client.get(js_url, headers={
                    "User-Agent": settings.USER_AGENT,
                    "Referer": page_url,
                    "Accept": "*/*",
                })
                if r.status_code != 200:
                    continue
                text = r.text
                # limit to 2MB to avoid huge bundles
                if len(text) > 2_000_000:
                    text = text[:2_000_000]
                pairs = self._discover_qs_txt_pairs_in_text(text, page_url)
                if pairs:
                    logger.info(f"🔎 Found .txt in JS[{idx}/{len(srcs)}]: {js_url}")
                    all_pairs.extend(pairs)
            except Exception:
                continue

        # unique by main url
        uniq = []
        seen_main = set()
        for p in all_pairs:
            if p[0] in seen_main:
                continue
            seen_main.add(p[0])
            uniq.append(p)
        return uniq

    # -------------------- fallback extractors (rarely needed for QS) --------------------

    def _extract_from_embedded_json_and_dataload(self, soup, html: str, page_url: str) -> List[Dict[str, Any]]:
        import json, re, html as htmlmod
        results = []

        # script JSON candidates
        for s in soup.find_all("script"):
            content = (s.string or s.text or "").strip()
            if not content:
                continue
            cands = []
            if content.startswith("{") or content.startswith("["):
                cands.append(content)
            m = re.search(r'__NEXT_DATA__\s*=\s*({.*?})\s*;', content, flags=re.S)
            if m:
                cands.append(m.group(1))
            m = re.search(r'window\.__NUXT__\s*=\s*({.*?});', content, flags=re.S)
            if m:
                cands.append(m.group(1))
            for cand in cands:
                try:
                    data = json.loads(cand)
                    self._collect_universities_from_obj(data, results)
                except Exception:
                    pass

        # data-* JSON
        for el in soup.find_all(True):
            for attr, val in list(el.attrs.items()):
                if not isinstance(val, str):
                    continue
                if ("{" in val or "[" in val) and ("\"" in val or "&quot;" in val):
                    decoded = htmlmod.unescape(val)
                    if len(decoded) > 10000:
                        decoded = decoded[:10000]
                    try:
                        start = decoded.find("{"); end = decoded.rfind("}")
                        if start != -1 and end != -1 and end > start:
                            import json as _json
                            self._collect_universities_from_obj(_json.loads(decoded[start:end+1]), results)
                            continue
                        import json as _json
                        self._collect_universities_from_obj(_json.loads(decoded), results)
                    except Exception:
                        pass

        final = []
        for r in results:
            name = (r.get("name") or r.get("title") or r.get("institution") or "").strip()
            if not name:
                continue
            final.append({
                "name": name,
                "rank": r.get("rank") or r.get("rank_display") or r.get("ranking"),
                "country": r.get("country") or r.get("country_name") or r.get("location") or "",
                "website": r.get("url") or r.get("profile_url") or r.get("website") or "",
                "raw_data": r
            })
        return final

    def _collect_universities_from_obj(self, obj, out_list: list):
        def maybe_push(d: dict):
            keys = set(k.lower() for k in d.keys())
            name = d.get("name") or d.get("title") or d.get("institution")
            if not name:
                return
            has_extra = any(k in keys for k in (
                "rank", "rank_display", "ranking", "url", "website", "profile_url",
                "country", "country_name", "location"
            ))
            if has_extra:
                out_list.append(d)

        if isinstance(obj, dict):
            maybe_push(obj)
            for v in obj.values():
                self._collect_universities_from_obj(v, out_list)
        elif isinstance(obj, list):
            for it in obj:
                self._collect_universities_from_obj(it, out_list)

    def _extract_from_ld_json(self, soup, page_url: str) -> List[Dict[str, Any]]:
        import json
        results = []
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "")
            except Exception:
                continue
            items = [data] if isinstance(data, dict) else (data if isinstance(data, list) else [])
            for d in items:
                item_list = d.get("itemListElement")
                if not isinstance(item_list, list):
                    continue
                for li in item_list:
                    item = li.get("item") if isinstance(li, dict) else None
                    if not isinstance(item, dict):
                        continue
                    name = item.get("name") or ""; url = item.get("url") or ""
                    if not name:
                        continue
                    results.append({
                        "name": name,
                        "website": url if url and url.startswith("http") else "",
                        "raw_data": {"source": "ld+json", "url": url}
                    })
        return results

    def _extract_from_links(self, soup, page_url: str) -> List[Dict[str, Any]]:
        from urllib.parse import urljoin
        results = []
        for a in soup.find_all("a", href=True):
            href = a["href"]; text = (a.get_text() or "").strip()
            if not text or len(text) < 3:
                continue
            if any(seg in href for seg in ("/universities/", "/university/", "/institutions/", "/colleges/")):
                if not self._is_valid_school_name(text):
                    text = a.get("title") or a.get("aria-label") or text
                results.append({
                    "name": text,
                    "website": "",
                    "raw_data": {"source": "links", "href": urljoin(page_url, href)}
                })
        return results

    # -------------------- validation --------------------

    def _is_valid_school_name(self, name: str) -> bool:
        """Multilingual, lenient school name check; still blocks obvious non-school phrases."""
        if not name or len(name.strip()) < 3:
            return False

        nl = name.lower()

        # Reject common noise (ranking titles, promos, etc.)
        if any(w in nl for w in self.non_school_patterns):
            return False

        # Accept if any school keyword is present
        if any(k in nl for k in self.school_keywords):
            # Avoid "top/best/ranking" only lines that also look like headlines
            if any(w in nl for w in ["rank", "ranking", "top", "best"]) and not any(
                w in nl for w in ["university", "college", "institute", "univers", "大学", "大學", "学院", "學院", "대학교", "大學院", "学校", "學校"]
            ):
                return False
            return True

        # Famous schools safety net
        famous = [
            "mit", "harvard", "stanford", "oxford", "cambridge", "yale", "princeton",
            "caltech", "eth zurich", "imperial", "ucl", "lse", "tsinghua", "peking",
            "nus", "ntu", "kaist", "tokyo", "kyoto", "melbourne", "anu"
        ]
        if any(k in nl for k in famous):
            return True

        return False

    # -------------------- misc --------------------

    def _source_domain(self, url: str) -> str:
        try:
            from urllib.parse import urlparse
            return urlparse(url).netloc
        except Exception:
            return "unknown"


# -------------------- CLI --------------------

async def main():
    import argparse

    parser = argparse.ArgumentParser(description="Crawl QS world university rankings")
    parser.add_argument("--limit", type=int, default=20, help="Total number to store")
    parser.add_argument("--max-pages", type=int, default=3, help="Max pages to crawl if next is discoverable (kept for API parity)")
    parser.add_argument("--url", type=str, default=None, help="Public ranking page URL (for discovery/fallback)")
    # Direct .txt (best)
    parser.add_argument("--qs-main-url", type=str, default=None, help="Direct QS main JSON .txt URL")
    parser.add_argument("--qs-indicators-url", type=str, default=None, help="Direct QS indicators .txt URL")
    args = parser.parse_args()

    logger.info("🚀 University Rankings Crawler")
    crawler = UniversityCrawler(
        start_url=args.url,
        qs_main_url=args.qs_main_url,
        qs_indicators_url=args.qs_indicators_url
    )

    logger.info(f"📊 Will crawl up to {args.limit} (max pages: {args.max_pages})")
    logger.info(f"🔗 Start URL: {crawler.ranking_url}")

    try:
        ok = await crawler.crawl_university_rankings(args.limit, args.max_pages)
        if ok:
            logger.info("✅ Crawling completed successfully!")
            sys.exit(0)
        else:
            logger.error("❌ Crawling failed")
            sys.exit(1)
    except KeyboardInterrupt:
        logger.info("\n🛑 Interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
