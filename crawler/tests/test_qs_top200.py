# tests/test_qs_top200.py
import os
import re
import json
import unicodedata
from typing import Dict, List, Tuple, Optional

import pytest
import httpx


# -------------------------------
# pytest CLI options
# -------------------------------
def pytest_addoption(parser):
    parser.addoption("--qs-main-url", action="store", required=True,
                     help="QS main .txt URL (JSON). Example: https://www.qschina.cn/.../<hash>.txt")
    parser.addoption("--source-like", action="store", required=True,
                     help="Sub-string to filter unreviewed_schools.source_url via ilike. "
                          "Example: /world-university-rankings/2026")
    parser.addoption("--supabase-url", action="store", default=os.getenv("SUPABASE_URL"),
                     help="Supabase URL. Defaults to env SUPABASE_URL")
    parser.addoption("--supabase-key", action="store", default=os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE"),
                     help="Supabase service role key. Defaults to env SUPABASE_SERVICE_ROLE_KEY")


@pytest.fixture(scope="session")
def opts(pytestconfig):
    supabase_url = pytestconfig.getoption("--supabase-url")
    supabase_key = pytestconfig.getoption("--supabase-key")
    if not supabase_url or not supabase_key:
        pytest.skip("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not provided")

    return {
        "qs_main_url": pytestconfig.getoption("--qs-main-url"),
        "source_like": pytestconfig.getoption("--source-like"),
        "supabase_url": supabase_url.rstrip("/"),
        "supabase_key": supabase_key,
    }


# -------------------------------
# Helpers: normalization & parsing
# -------------------------------
_SPACES = re.compile(r"\s+")
_PARENS = re.compile(r"\s*\(.*?\)\s*")

def normalize_name(name: str) -> str:
    """Robust name normalization for matching across QS & DB."""
    if not name:
        return ""
    s = unicodedata.normalize("NFKD", name)
    s = s.encode("ascii", "ignore").decode("ascii")  # drop accents
    s = s.lower().strip()
    s = _PARENS.sub(" ", s)  # drop parenthetical short names like "(MIT)"
    s = s.replace("&", "and")
    if s.startswith("the "):
        s = s[4:]
    # remove non-alnum
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = _SPACES.sub(" ", s).strip()
    return s


def parse_rank_to_int(v: Optional[str | int | float]) -> Optional[int]:
    """QS rank parser:
       - '=1'  -> 1
       - '151-200' -> 200  (取上界，便于和你库里的整型字段匹配)
       - '200' -> 200
    """
    if v is None:
        return None
    if isinstance(v, (int, float)):
        try:
            return int(v)
        except Exception:
            return None

    s = str(v).strip()
    if not s:
        return None

    # remove leading '='
    if s.startswith("="):
        s = s[1:].strip()

    # range like '151-200'
    if "-" in s:
        parts = [p for p in re.split(r"[^0-9]+", s) if p.isdigit()]
        if parts:
            try:
                nums = [int(x) for x in parts]
                return max(nums)  # choose upper bound
            except Exception:
                return None

    # single number
    if s.isdigit():
        return int(s)

    # last resort: pick trailing digits
    m = re.search(r"(\d+)$", s)
    if m:
        return int(m.group(1))
    return None


# -------------------------------
# Fetchers
# -------------------------------
def _headers_for_json(referer: Optional[str] = None) -> Dict[str, str]:
    h = {
        "User-Agent": "Mozilla/5.0 (compatible; QS-Top200-Test/1.0)",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9,zh;q=0.8",
    }
    if referer:
        h["Referer"] = referer
    return h


async def fetch_qs_top200(qs_main_url: str) -> Dict[str, int]:
    """Return mapping: normalized_name -> rank_int (<=200) from QS .txt main JSON."""
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        r = await client.get(qs_main_url, headers=_headers_for_json())
        r.raise_for_status()
        try:
            data = r.json()
        except Exception:
            data = json.loads(r.text)

    rows = data.get("data", data) if isinstance(data, dict) else data
    if not isinstance(rows, list):
        raise AssertionError("QS main JSON format unexpected: 'data' not a list")

    def html_text(s: str) -> str:
        try:
            from bs4 import BeautifulSoup
            return BeautifulSoup(s, "html.parser").get_text(" ", strip=True)
        except Exception:
            return s

    top200: Dict[str, int] = {}
    for it in rows:
        raw_title = it.get("title") or it.get("name") or ""
        if not raw_title:
            continue
        name = normalize_name(html_text(raw_title))
        rank = parse_rank_to_int(it.get("rank_display") or it.get("overall_rank"))
        if rank is not None and rank <= 200 and name:
            top200[name] = rank

    # QS Top200 通常应当有 200 条（极少数并列/缺项可能略有误差）
    assert len(top200) > 150, f"QS Top list seems too small: got {len(top200)}"
    return top200


async def fetch_db_top200(supabase_url: str, supabase_key: str, source_like: str) -> Dict[str, Tuple[int, str]]:
    """Return mapping: normalized_name -> (db_rank, row_id) from unreviewed_schools (qs_ranking<=200)."""
    base = f"{supabase_url.rstrip('/')}/rest/v1"
    params = (
        f"select=id,name,qs_ranking,source_url"
        f"&qs_ranking=lte.200"
        f"&source_url=ilike.*{source_like}*"
        f"&limit=2000"
    )
    url = f"{base}/unreviewed_schools?{params}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, headers={
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Accept": "application/json",
        })
        r.raise_for_status()
        rows = r.json()

    out: Dict[str, Tuple[int, str]] = {}
    for row in rows:
        name = normalize_name(row.get("name") or "")
        rank = row.get("qs_ranking")
        if name and isinstance(rank, int) and rank <= 200:
            out[name] = (rank, row.get("id"))
    return out


# -------------------------------
# Tests
# -------------------------------
@pytest.mark.asyncio
async def test_top200_presence_and_ranks(opts):
    """确保库里覆盖了 QS Top200，且排名一致。"""
    qs_map = await fetch_qs_top200(opts["qs_main_url"])
    db_map = await fetch_db_top200(opts["supabase_url"], opts["supabase_key"], opts["source_like"])

    # 1) 覆盖率：QS 每所学校都应在 DB（name 归一化后）
    missing = [orig for orig, r in qs_map.items() if orig not in db_map]
    assert not missing, (
        f"Missing {len(missing)} QS Top200 schools in DB. "
        f"Examples: {missing[:10]}"
    )

    # 2) 排名一致性（允许 QS 端并列已被解析为整数；你库里应使用相同规则）
    mismatched: List[Tuple[str, int, int]] = []
    for name, qs_rank in qs_map.items():
        db_rank = db_map[name][0]
        if db_rank != qs_rank:
            mismatched.append((name, qs_rank, db_rank))
    assert not mismatched, (
        "Rank mismatch for some schools. "
        + "; ".join([f"{n}: QS={qr}, DB={dr}" for n, qr, dr in mismatched[:10]])
    )

    # 3) 额外 sanity：DB 里不应有“≤200的学校名”却不在 QS Top200
    extras = [n for n in db_map.keys() if n not in qs_map]
    # 不是致命，但提示一下
    if extras:
        print(f"[Note] {len(extras)} DB entries (<=200) not in QS list. Examples: {extras[:10]}")
