"""
Supabase Data Manager
Handles storing crawled data to Supabase unreviewed tables
"""

import os
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime

from loguru import logger
import httpx
from dotenv import load_dotenv, find_dotenv

from crawler.config.settings import settings


class SupabaseManager:
    """Manages data storage to Supabase using PostgREST endpoints (rest/v1)."""

    def __init__(self):
        # Load environment (.env can override settings)
        load_dotenv(find_dotenv())

        # URL: prefer .env, then settings; strip trailing slash
        self.supabase_url = (os.getenv("SUPABASE_URL") or settings.SUPABASE_URL or "").rstrip("/")
        if not self.supabase_url:
            raise ValueError("Supabase URL is required")

        # Force service role key for backend crawler (bypass RLS)
        service_key = (
            os.getenv("SUPABASE_SERVICE_ROLE")
            or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", None)
            or getattr(settings, "SUPABASE_KEY", None)  # last resort
        )
        if not service_key:
            raise ValueError("Supabase service role key is required")

        self.supabase_key = service_key
        self.base = f"{self.supabase_url}/rest/v1"

        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        self.client = httpx.AsyncClient(timeout=20.0)

        logger.info("🔗 Supabase manager initialized with service_role key")
        logger.info("🔓 Using service role key - bypassing RLS policies")

    # ---------- utils ----------

    def _json_or_none(self, response: httpx.Response):
        ct = response.headers.get("Content-Type", "")
        if response.content and "application/json" in ct:
            try:
                return response.json()
            except Exception:
                return None
        return None

    # NEW: rank 规整（含等号/区间/1001+）
    def _normalize_qs_ranking(self, val: Any) -> Tuple[Optional[str], Optional[int], Optional[int]]:
        """
        输入原始 rank（如 '1201-1400', '=9', '1001+', 3, None）
        返回: (display, min_int, max_int)
        你的表 qs_ranking 是 integer 的话，用 min_int 写入；其余放 raw_data。
        满足你“带等号的一律用等号后的数字”的要求。
        """
        if val is None:
            return (None, None, None)
        s = str(val).strip()
        if not s:
            return (None, None, None)

        # 带等号：直接去等号取数字部分
        if s.startswith("="):
            s_num = s[1:].strip()
            try:
                n = int(s_num)
                return (f"={n}", n, n)
            except:
                return (s, None, None)

        # 1001+ 这种：写最小值 1001
        if s.endswith("+"):
            base = s[:-1].strip()
            try:
                n = int(base)
                return (f"{n}+", n, None)
            except:
                return (s, None, None)

        # 区间：501-510 → (501, 510)
        if "-" in s:
            a, b = s.split("-", 1)
            try:
                amin = int(a.strip())
                bmax = int(b.strip())
                return (f"{amin}-{bmax}", amin, bmax)
            except:
                return (s, None, None)

        # 纯数字
        try:
            n = int(s)
            return (str(n), n, n)
        except:
            return (s, None, None)

    def _is_empty_value(self, v: Any) -> bool:
        if v is None:
            return True
        if isinstance(v, str) and v.strip() == "":
            return True
        return False

    # ---------- health/auth ----------

    async def check_auth_status(self) -> bool:
        try:
            url = f"{self.base}/unreviewed_schools?select=count"
            resp = await self.client.get(url, headers=self.headers)
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"Auth check failed: {e}")
            return False

    # ---------- inserts ----------

    async def store_unreviewed_school(self, school_data: Dict[str, Any]) -> Optional[str]:
        """
        仅插入（不做局部更新）。保留以兼容旧调用。
        若你启用了 enrich_or_insert_unreviewed_school，优先用后者。
        """
        try:
            # CHANGED: 先处理 rank
            qs_display, qs_min, qs_max = self._normalize_qs_ranking(school_data.get("qs_ranking"))

            insert_data = {
                "name": school_data.get("name"),
                "initial": school_data.get("initial"),
                "type": school_data.get("type"),
                "country": school_data.get("country"),
                "location": school_data.get("location"),
                "year_founded": school_data.get("year_founded"),
                "qs_ranking": qs_min if qs_min is not None else None,   # 避免 22P02
                "website_url": school_data.get("website_url") or school_data.get("website"),
                "source_url": school_data.get("source_url"),
                "confidence_score": school_data.get("confidence_score", 0.0),
                "raw_data": school_data.get("raw_data", {}),
                "status": "pending",
            }

            # 把 display / 区间存进 raw_data 备用
            raw = insert_data.get("raw_data") or {}
            if qs_display is not None:
                raw["qs_ranking_display"] = qs_display
            if qs_min is not None:
                raw["qs_rank_min"] = qs_min
            if qs_max is not None:
                raw["qs_rank_max"] = qs_max
            insert_data["raw_data"] = raw

            insert_data = {k: v for k, v in insert_data.items() if v is not None}

            resp = await self.client.post(
                f"{self.base}/unreviewed_schools",
                headers=self.headers,
                json=insert_data,
            )

            if resp.status_code in (200, 201):
                result = self._json_or_none(resp)
                school_id = (result or [{}])[0].get("id") if isinstance(result, list) else None
                logger.info(f"✅ Stored school: {school_data.get('name')} (ID: {school_id})")
                return school_id
            else:
                logger.error(
                    f"❌ Failed to store school: {resp.status_code} - {resp.text} "
                    f"(payload_types={{k:type(v).__name__ for k,v in insert_data.items()}})"
                )
                return None
        except Exception as e:
            logger.error(f"❌ Error storing school data: {e}")
            return None

    async def store_unreviewed_program(self, program_data: Dict[str, Any]) -> Optional[str]:
        try:
            insert_data = {
                "name": program_data.get("name"),
                "initial": program_data.get("initial"),
                "school_id": program_data.get("school_id"),
                "degree": program_data.get("degree"),
                "website_url": program_data.get("website_url") or program_data.get("website"),
                "duration_years": program_data.get("duration_years"),
                "currency": program_data.get("currency"),
                "total_tuition": program_data.get("total_tuition"),
                "is_stem": program_data.get("is_stem"),
                "description": program_data.get("description"),
                "credits": program_data.get("credits"),
                "delivery_method": program_data.get("delivery_method"),
                "schedule_type": program_data.get("schedule_type"),
                "location": program_data.get("location"),
                "add_ons": program_data.get("add_ons"),
                "start_date": program_data.get("start_date"),
                "school_name": program_data.get("school_name"),
                "source_url": program_data.get("source_url"),
                "confidence_score": program_data.get("confidence_score", 0.0),
                "raw_data": program_data.get("raw_data", {}),
                "status": "pending",
            }
            insert_data = {k: v for k, v in insert_data.items() if v is not None}

            resp = await self.client.post(
                f"{self.base}/unreviewed_programs",
                headers=self.headers,
                json=insert_data,
            )

            if resp.status_code in (200, 201):
                result = self._json_or_none(resp)
                program_id = (result or [{}])[0].get("id") if isinstance(result, list) else None
                logger.info(f"✅ Stored program: {program_data.get('name')} (ID: {program_id})")
                return program_id
            else:
                logger.error(f"❌ Failed to store program: {resp.status_code} - {resp.text}")
                return None
        except Exception as e:
            logger.error(f"❌ Error storing program data: {e}")
            return None

    # ---------- jobs & logs ----------

    async def create_crawler_job(self, job_name: str, metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        try:
            job_data = {
                "job_name": job_name,
                "status": "running",
                "metadata": (metadata or {}),
            }
            resp = await self.client.post(
                f"{self.base}/crawler_jobs",
                headers=self.headers,
                json=job_data,
            )

            if resp.status_code in (200, 201):
                result = self._json_or_none(resp)
                job_id = (result or [{}])[0].get("id") if isinstance(result, list) else None
                logger.info(f"✅ Created crawler job: {job_name} (ID: {job_id})")
                return job_id
            else:
                logger.error(f"❌ Failed to create job: {resp.status_code} - {resp.text}")
                return None
        except Exception as e:
            logger.error(f"❌ Error creating crawler job: {e}")
            return None

    async def update_crawler_job(self, job_id: Optional[str], status: str, stats: Optional[Dict[str, Any]] = None):
        try:
            if not job_id:
                logger.warning("⚠️ No job_id provided; skip update_crawler_job")
                return

            update_data = {"status": status}
            if status in ("completed", "failed", "cancelled"):
                update_data["completed_at"] = datetime.utcnow().isoformat()

            if stats:
                update_data.update({
                    "total_items": stats.get("total_items", 0),
                    "successful_items": stats.get("successful_items", 0),
                    "failed_items": stats.get("failed_items", 0),
                })

            update_data = {k: v for k, v in update_data.items() if v is not None}

            resp = await self.client.patch(
                f"{self.base}/crawler_jobs?id=eq.{job_id}",
                headers=self.headers,
                json=update_data,
            )

            if resp.status_code in (200, 204):
                logger.info(f"✅ Updated job {job_id} status to {status}")
            else:
                logger.error(f"❌ Failed to update job: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.error(f"❌ Error updating crawler job: {e}")

    async def log_crawler_message(self, job_id: Optional[str], level: str, message: str, context: Optional[Dict[str, Any]] = None):
        try:
            log_data = {
                "job_id": job_id,
                "level": level.upper(),
                "message": message,
                "context": context or {},
            }

            resp = await self.client.post(
                f"{self.base}/crawler_logs",
                headers=self.headers,
                json=log_data,
            )

            if resp.status_code in (200, 201):
                logger.debug(f"📝 Logged message: {level} - {message}")
            else:
                logger.error(f"❌ Failed to log message: {resp.status_code} - {resp.text}")
        except Exception as e:
            logger.error(f"❌ Error logging message: {e}")

    # ---------- existence checks (main tables) ----------

    async def check_existing_school(self, name: str, website: Optional[str] = None) -> Optional[str]:
        try:
            if not name:
                return None

            params: List[str] = ["select=id", f"name=ilike.*{name}*"]
            if website:
                params.append(f"website_url=ilike.*{website}*")
            url = f"{self.base}/schools?{'&'.join(params)}"

            resp = await self.client.get(url, headers=self.headers)
            if resp.status_code == 200:
                data = self._json_or_none(resp)
                if isinstance(data, list) and data:
                    return data[0].get("id")
            return None
        except Exception as e:
            logger.error(f"❌ Error checking existing school: {e}")
            return None

    async def check_existing_program(self, name: str, school_name: str) -> Optional[str]:
        try:
            if not name or not school_name:
                return None

            school_id = await self.check_existing_school(school_name)
            if not school_id:
                return None

            params = ["select=id", f"name=ilike.*{name}*", f"school_id=eq.{school_id}"]
            url = f"{self.base}/programs?{'&'.join(params)}"

            resp = await self.client.get(url, headers=self.headers)
            if resp.status_code == 200:
                data = self._json_or_none(resp)
                if isinstance(data, list) and data:
                    return data[0].get("id")
            return None
        except Exception as e:
            logger.error(f"❌ Error checking existing program: {e}")
            return None

    # ---------- partial update flow for unreviewed_schools ----------

    async def get_unreviewed_school_by_match(
        self,
        *,
        school_id: Optional[str] = None,
        website_url: Optional[str] = None,
        name: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        try:
            if school_id:
                url = f"{self.base}/unreviewed_schools?select=*&id=eq.{school_id}&limit=1"
                r = await self.client.get(url, headers=self.headers)
                if r.status_code == 200:
                    rows = r.json()
                    if rows:
                        return rows[0]

            if website_url:
                url = f"{self.base}/unreviewed_schools?select=*&website_url=ilike.*{website_url}*&limit=1"
                r = await self.client.get(url, headers=self.headers)
                if r.status_code == 200:
                    rows = r.json()
                    if rows:
                        return rows[0]

            if name:
                url = f"{self.base}/unreviewed_schools?select=*&name=ilike.*{name}*&limit=1"
                r = await self.client.get(url, headers=self.headers)
                if r.status_code == 200:
                    rows = r.json()
                    if rows:
                        return rows[0]

            return None
        except Exception as e:
            logger.error(f"❌ get_unreviewed_school_by_match failed: {e}")
            return None

    async def patch_unreviewed_school(self, school_id: str, updates: Dict[str, Any]) -> bool:
        try:
            if not updates:
                return True

            current = await self.get_unreviewed_school_by_match(school_id=school_id)
            if current is None:
                logger.warning(f"⚠️ patch_unreviewed_school: id={school_id} not found")
                return False

            payload = {k: v for k, v in updates.items() if v is not None}

            # CHANGED: qs_ranking 在 PATCH 时也规整
            if "qs_ranking" in payload:
                disp, rmin, rmax = self._normalize_qs_ranking(payload["qs_ranking"])
                if rmin is not None:
                    payload["qs_ranking"] = rmin
                else:
                    payload.pop("qs_ranking", None)

                # 合并 raw_data
                old_raw = current.get("raw_data") or {}
                new_raw = updates.get("raw_data") or {}
                merged = {**old_raw, **new_raw}
                if disp is not None:
                    merged["qs_ranking_display"] = disp
                if rmin is not None:
                    merged["qs_rank_min"] = rmin
                if rmax is not None:
                    merged["qs_rank_max"] = rmax
                payload["raw_data"] = merged
            else:
                # 合并 raw_data（非 rank）：
                if "raw_data" in updates:
                    old_raw = current.get("raw_data") or {}
                    new_raw = updates.get("raw_data") or {}
                    if isinstance(old_raw, dict) and isinstance(new_raw, dict):
                        payload["raw_data"] = {**old_raw, **new_raw}

            r = await self.client.patch(
                f"{self.base}/unreviewed_schools?id=eq.{school_id}",
                headers=self.headers,
                json=payload,
            )
            if r.status_code in (200, 204):
                return True

            logger.error(f"❌ patch_unreviewed_school failed: {r.status_code} - {r.text}")
            return False
        except Exception as e:
            logger.error(f"❌ patch_unreviewed_school error: {e}")
            return False

    async def enrich_or_insert_unreviewed_school(
        self,
        data: Dict[str, Any],
        *,
        fill_only_empty: bool = True
    ) -> Tuple[Optional[str], str]:
        """
        命中已有：只补空字段（默认），raw_data 合并；qs_ranking 统一做规整。
        未命中：插入新行。
        返回: (id, action)  action ∈ {"inserted","enriched","skipped"}
        """
        try:
            name = (data.get("name") or "").strip()
            website_url = (data.get("website_url") or data.get("website") or "").strip()
            source_url = (data.get("source_url") or "").strip()

            # 统一处理 rank
            disp, rmin, rmax = self._normalize_qs_ranking(data.get("qs_ranking"))

            candidate_fields = [
                "year_founded",
                "country",
                "location",
                "website_url",
                "initial",
                "type",
                "confidence_score",
                "source_url",
                # qs_ranking 在下面单独处理
            ]

            existing = await self.get_unreviewed_school_by_match(
                website_url=website_url or None,
                name=name or None,
            )

            if existing:
                patch: Dict[str, Any] = {}

                if fill_only_empty:
                    for f in candidate_fields:
                        old_v = existing.get(f)
                        new_v = data.get(f)
                        if self._is_empty_value(old_v) and not self._is_empty_value(new_v):
                            patch[f] = new_v
                else:
                    for f in candidate_fields:
                        if data.get(f) is not None:
                            patch[f] = data[f]

                # rank（单独逻辑）
                if rmin is not None:
                    old_rank = existing.get("qs_ranking")
                    # 只有在旧 rank 为空时，才补写（fill_only_empty=True 的策略）
                    if (fill_only_empty and self._is_empty_value(old_rank)) or (not fill_only_empty):
                        patch["qs_ranking"] = rmin

                # 合并 raw_data
                raw = data.get("raw_data") or {}
                if disp is not None:
                    raw["qs_ranking_display"] = disp
                if rmin is not None:
                    raw["qs_rank_min"] = rmin
                if rmax is not None:
                    raw["qs_rank_max"] = rmax
                if raw:
                    patch["raw_data"] = raw

                if patch:
                    ok = await self.patch_unreviewed_school(existing["id"], patch)
                    return (existing["id"] if ok else None, "enriched" if ok else "skipped")
                else:
                    return (existing["id"], "skipped")

            # 未命中 → 插入
            insert_payload = {
                "name": name,
                "initial": data.get("initial"),
                "type": data.get("type"),
                "country": data.get("country"),
                "location": data.get("location"),
                "year_founded": data.get("year_founded"),
                "qs_ranking": rmin if rmin is not None else None,   # 避免 22P02
                "website_url": website_url or data.get("website"),
                "source_url": source_url,
                "confidence_score": data.get("confidence_score", 0.0),
                "raw_data": data.get("raw_data", {}),
                "status": data.get("status", "pending"),
            }

            # raw_data 叠加 rank 展示
            raw = insert_payload.get("raw_data") or {}
            if disp is not None:
                raw["qs_ranking_display"] = disp
            if rmin is not None:
                raw["qs_rank_min"] = rmin
            if rmax is not None:
                raw["qs_rank_max"] = rmax
            insert_payload["raw_data"] = raw

            insert_payload = {k: v for k, v in insert_payload.items() if v is not None}

            r = await self.client.post(
                f"{self.base}/unreviewed_schools",
                headers=self.headers,
                json=insert_payload,
            )
            if r.status_code in (200, 201):
                res = self._json_or_none(r)
                row_id = (res or [{}])[0].get("id") if isinstance(res, list) else None
                return (row_id, "inserted")

            logger.error(
                f"❌ insert unreviewed_school failed: {r.status_code} - {r.text} "
                f"(payload_types={{k:type(v).__name__ for k,v in insert_payload.items()}})"
            )
            return (None, "skipped")

        except Exception as e:
            logger.error(f"❌ enrich_or_insert_unreviewed_school error: {e}")
            return (None, "skipped")

    # ---------- cleanup ----------

    async def aclose(self):
        try:
            await self.client.aclose()
        except Exception:
            pass


# Global instance
supabase_manager = SupabaseManager()
