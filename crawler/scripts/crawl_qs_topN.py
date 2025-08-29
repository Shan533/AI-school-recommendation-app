#!/usr/bin/env python3
"""
Ensure QS Top-N script

Policy:
1) Check current DB (unreviewed_schools) for entries with qs_ranking <= N
   - If max != N or count < N or ranks missing, then fetch and upsert
2) Fetch from QS .txt (main + optional indicators)
   - Normalize rank string to integer:
       '=5' -> 5
       '5'  -> 5
       '201-250' -> 250  (store upper bound as integer)
   - Keep ONLY rows where normalized rank <= N
3) Upsert via supabase_manager.enrich_or_insert_unreviewed_school(fill_only_empty=True)
   - Only fill empty fields, merge raw_data
"""

import asyncio
import sys
from typing import Any, Dict, List, Optional, Tuple, Set

from loguru import logger
import httpx

from crawler.config.settings import settings
from crawler.storage.supabase_manager import supabase_manager


# ----------------------- helpers -----------------------

def _strip_html_to_text(s: Optional[str]) -> str:
    if not s or not isinstance(s, str):
        return ""
    try:
        from bs4 import BeautifulSoup
        return BeautifulSoup(s, "html.parser").get_text(" ", strip=True)
    except Exception:
        return s


def _parse_rank_bounds(rank_str: Any) -> Tuple[Optional[int], Optional[int]]:
    """
    Parse QS rank text to (low, high):
    - '=5' -> (5, 5)
    - '5'  -> (5, 5)
    - '201-250' -> (201, 250)
    - others -> (None, None)
    """
    if rank_str is None:
        return (None, None)
    s = str(rank_str).strip().replace("=", "")
    if not s:
        return (None, None)
    if s.isdigit():
        n = int(s)
        return (n, n)
    if "-" in s:
        a, b = s.split("-", 1)
        a = a.strip()
        b = b.strip()
        if a.isdigit() and b.isdigit():
            return (int(a), int(b))
    return (None, None)


def _normalize_rank_to_int(rank_str: Any) -> Optional[int]:
    lo, hi = _parse_rank_bounds(rank_str)
    if lo is None or hi is None:
        return None
    # store the upper bound as integer (e.g., '201-250' -> 250)
    return hi


def _is_probably_university(name: str) -> bool:
    """
    Very loose heuristic: allow multilingual variants.
    """
    if not name or len(name.strip()) < 3:
        return False
    n = name.lower()
    keywords = [
        "university", "college", "institute", "academy", "school",
        "univers", "universi", "universit",  # romance roots
        "universidad", "universidade", "université", "università",
        "universität", "universiteit", "universitat", "universitas",
        "universitet", "univerzita",
        "大学", "大學", "学院", "學院", "대학교", "대학",
    ]
    return any(k in n for k in keywords)


def is_qs_url(url: str) -> bool:
    """Check if the URL is a QS URL."""
    return "qschina.cn" in url or "topuniversities.com" in url


# ----------------------- supabase checks -----------------------

async def fetch_topN_status(N: int, source_like: Optional[str] = None) -> Tuple[int, Optional[int], Set[int]]:
    """
    Pull qs_ranking <= N from unreviewed_schools, optionally filter by source_url ilike *source_like*.
    Return: (count, max_rank, present_ranks_set)
    """
    try:
        params = [f"select=qs_ranking", f"qs_ranking=lte.{N}", "limit=400", "order=qs_ranking.asc"]
        if source_like:
            params.append(f"source_url=ilike.*{source_like}*")
        url = f"{supabase_manager.base}/unreviewed_schools?{'&'.join(params)}"
        r = await supabase_manager.client.get(url, headers=supabase_manager.headers)
        if r.status_code != 200:
            logger.error(f"❌ Failed to query top{N} status: {r.status_code} - {r.text}")
            return (0, None, set())
        rows = r.json()
        ranks = [row.get("qs_ranking") for row in rows if isinstance(row.get("qs_ranking"), int)]
        c = len(ranks)
        m = max(ranks) if ranks else None
        return (c, m, set(ranks))
    except Exception as e:
        logger.error(f"❌ fetch_top{N}_status error: {e}")
        return (0, None, set())


def need_fetch_topN(N: int, count: int, max_rank: Optional[int], present: Set[int]) -> bool:
    """
    Decide if we need to fetch:
    - not enough rows
    - max_rank is None or < N
    - there are missing ranks in 1..N
    """
    if count < N:
        return True
    if max_rank is None or max_rank < N:
        return True
    missing = set(range(1, N + 1)) - present
    return len(missing) > 0


# ----------------------- QS fetch (.txt) -----------------------

async def fetch_qs_txt(main_url: str,
                       indicators_url: Optional[str],
                       referer: Optional[str],
                       N: int) -> List[Dict[str, Any]]:
    if not is_qs_url(main_url):
        logger.error("❌ The provided URL is not a QS URL.")
        return []

    import json
    from urllib.parse import urlparse, urljoin
    from bs4 import BeautifulSoup

    async def _get_json(url: str) -> Optional[Any]:
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT, follow_redirects=True) as client:
            r = await client.get(url, headers={
                "User-Agent": settings.USER_AGENT,
                "Referer": referer or "",
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

    main = await _get_json(main_url)
    if not main:
        return []
    indicators = await _get_json(indicators_url) if indicators_url else None

    rows = main.get("data", main) if isinstance(main, dict) else main
    if not isinstance(rows, list):
        return []

    origin = ""
    if referer:
        parsed = urlparse(referer)
        origin = f"{parsed.scheme}://{parsed.netloc}"

    out: List[Dict[str, Any]] = []
    for it in rows:
        raw_title = it.get("title") or it.get("name") or ""
        name = _strip_html_to_text(raw_title)
        if not _is_probably_university(name):
            continue

        # extract profile link from HTML title if present
        website = ""
        try:
            a = BeautifulSoup(raw_title, "html.parser").find("a", href=True)
            if a and a.get("href"):
                href = a["href"]
                website = href if href.startswith("http") else urljoin(origin, href)
        except Exception:
            pass

        # normalize rank
        norm_rank = _normalize_rank_to_int(it.get("rank_display") or it.get("overall_rank"))
        if norm_rank is None or norm_rank > N:
            continue

        # basic fields
        out.append({
            "name": name,
            "initial": name[:3].upper(),
            "type": "University",
            "country": it.get("country") or it.get("country_name") or "",
            "location": it.get("city") or it.get("location") or "",
            "year_founded": it.get("founded") or it.get("year_founded"),
            "qs_ranking": norm_rank,   # integer for DB
            "website_url": website,
            "source_url": referer or "",
            "confidence_score": 0.95,
            "raw_data": {
                "row": it,
                "logo": it.get("logo"),
                "region": it.get("region"),
                "nid": it.get("nid"),
                "core_id": it.get("core_id"),
                "qs_ranking_text": (it.get("rank_display") or it.get("overall_rank")),
                "indicators": {k: it.get(k) for k in it.keys() if k.startswith("ind_")},
                "from": "qs_txt",
            },
        })

    # sort by rank ascending for determinism
    out.sort(key=lambda r: r["qs_ranking"])
    return out


# ----------------------- main flow -----------------------

async def ensure_topN(
    N: int,
    qs_main_url: str,
    qs_indicators_url: Optional[str],
    source_like: Optional[str],
    referer: Optional[str],
    dry_run: bool = False
) -> int:
    """
    Returns exit code: 0 success, 1 failure
    """
    logger.info(f"🔎 Checking current Top-{N} status in DB ...")
    cnt, mx, present = await fetch_topN_status(N, source_like=source_like)
    missing = sorted(list(set(range(1, N + 1)) - present))
    logger.info(f"📊 DB status: count={cnt}, max_rank={mx}, missing_count={len(missing)}")
    if missing[:10]:
        logger.info(f"🔧 Missing sample: {missing[:10]} ...")

    if not need_fetch_topN(N, cnt, mx, present):
        logger.info(f"✅ Already complete (1..{N} present). Nothing to do.")
        return 0

    logger.info(f"⬇️  Fetching QS .txt (Top-{N} only) ...")
    rows = await fetch_qs_txt(qs_main_url, qs_indicators_url, referer or source_like, N)
    logger.info(f"📥 Fetched rows (rank<={N}): {len(rows)}")

    if dry_run:
        logger.info("🧪 Dry-run mode: not writing to DB.")
        return 0

    stored, enriched, skipped, failed = 0, 0, 0, 0
    for i, r in enumerate(rows, 1):
        try:
            row_id, action = await supabase_manager.enrich_or_insert_unreviewed_school(
                {
                    "name": r["name"],
                    "initial": r.get("initial"),
                    "type": r.get("type", "University"),
                    "country": r.get("country"),
                    "location": r.get("location"),
                    "year_founded": r.get("year_founded"),
                    "qs_ranking": r.get("qs_ranking"),        # integer
                    "website_url": r.get("website_url") or r.get("website"),
                    "source_url": r.get("source_url"),
                    "confidence_score": r.get("confidence_score", 0.95),
                    "raw_data": r.get("raw_data", {}),
                    "status": "pending",
                },
                fill_only_empty=True
            )
            if action == "inserted":
                stored += 1
            elif action == "enriched":
                enriched += 1
            else:
                skipped += 1

            if i % 25 == 0:
                logger.info(f"   Progress: {i}/{len(rows)} (inserted={stored}, enriched={enriched}, skipped={skipped})")
        except Exception as e:
            failed += 1
            logger.error(f"❌ Upsert failed for '{r.get('name')}' (rank={r.get('qs_ranking')}): {e}")

    logger.info(f"✅ Done. inserted={stored}, enriched={enriched}, skipped={skipped}, failed={failed}")

    # final check
    cnt2, mx2, present2 = await fetch_topN_status(N, source_like=source_like)
    missing2 = sorted(list(set(range(1, N + 1)) - present2))
    logger.info(f"📊 After upsert: count={cnt2}, max_rank={mx2}, missing_count={len(missing2)}")
    return 0


async def main():
    import argparse

    p = argparse.ArgumentParser(description="Ensure QS Top-N in unreviewed_schools")
    p.add_argument("--qs-main-url", required=True, help="QS main .txt URL")
    p.add_argument("--qs-indicators-url", default=None, help="QS indicators .txt URL (optional)")
    p.add_argument("--source-like", default="/world-university-rankings/2026",
                   help="Filter source_url with ilike *this* when checking DB (default: substring of 2026 page)")
    p.add_argument("--referer", default="https://www.qschina.cn/en/university-rankings/world-university-rankings/2026",
                   help="Referer header for QS fetch (default: 2026 page)")
    p.add_argument("--dry-run", action="store_true", help="Fetch and show but do not write DB")
    p.add_argument("--top-n", type=int, default=200, help="Number of top rankings to ensure (default: 200)")
    args = p.parse_args()

    logger.info(f"🚀 Ensure QS Top-{args.top_n}")
    logger.info(f"🔗 main={args.qs_main_url}")
    if args.qs_indicators_url:
        logger.info(f"🔗 ind ={args.qs_indicators_url}")
    logger.info(f"🔍 DB filter source_like: {args.source_like}")

    try:
        code = await ensure_topN(
            N=args.top_n,
            qs_main_url=args.qs_main_url,
            qs_indicators_url=args.qs_indicators_url,
            source_like=args.source_like,
            referer=args.referer,
            dry_run=args.dry_run
        )
        sys.exit(code)
    except KeyboardInterrupt:
        logger.info("\n🛑 Interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        sys.exit(1)
    finally:
        try:
            await supabase_manager.aclose()
        except Exception:
            pass


if __name__ == "__main__":
    asyncio.run(main())
