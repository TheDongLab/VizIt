from __future__ import annotations

import importlib
import logging
from dataclasses import dataclass, field
from typing import Callable, List, Optional

logger = logging.getLogger("vizit.remote_capabilities")


@dataclass
class CapabilityResult:
    name: str  # short id
    required_for: str  # description of the feature
    ok: Optional[bool]  # True = available, False = missing, None = could not determine
    detail: str  # description of the check and its result
    fix_hint: str = ""  # how to install


# --------------------------------------------------------------------------- #
#  Registry
# --------------------------------------------------------------------------- #
CapabilityCheck = Callable[[], CapabilityResult]
_CHECKS: List[CapabilityCheck] = []


def register_capability_check(fn: CapabilityCheck) -> CapabilityCheck:
    _CHECKS.append(fn)
    return fn


def run_capability_checks() -> List[CapabilityResult]:
    results: List[CapabilityResult] = []
    for fn in _CHECKS:
        try:
            results.append(fn())
        except Exception as exc:
            results.append(
                CapabilityResult(
                    name=getattr(fn, "__name__", "unknown"),
                    required_for="unknown",
                    ok=None,
                    detail=f"capability check raised {type(exc).__name__}: {exc}",
                )
            )
    return results


# --------------------------------------------------------------------------- #
#  Probes
# --------------------------------------------------------------------------- #
def _module_available(modname: str) -> bool:
    try:
        importlib.import_module(modname)
        return True
    except Exception:
        return False


@register_capability_check
def check_polars_http() -> CapabilityResult:
    have_fsspec = _module_available("fsspec")
    have_aiohttp = _module_available("aiohttp")
    ok = have_fsspec and have_aiohttp
    if ok:
        detail = "fsspec + aiohttp present; polars can read parquet/CSV over http(s)."
        fix = ""
    else:
        missing = [
            m
            for m, present in (("fsspec", have_fsspec), ("aiohttp", have_aiohttp))
            if not present
        ]
        detail = (
            f"missing {', '.join(missing)}; polars cannot read parquet/CSV from "
            "remote URLs (gene/SNP locations, QTL parquet, GWAS tables)."
        )
        fix = "pip install fsspec aiohttp"
    return CapabilityResult(
        name="polars-http",
        required_for="remote QTL parquet / gene & SNP locations / GWAS tables",
        ok=ok,
        detail=detail,
        fix_hint=fix,
    )


@register_capability_check
def check_pybigwig_remote() -> CapabilityResult:
    try:
        import pyBigWig
    except Exception as exc:
        return CapabilityResult(
            name="pybigwig-remote",
            required_for="remote BigWig signal tracks",
            ok=None,
            detail=f"pyBigWig import failed: {type(exc).__name__}: {exc}",
            fix_hint="pip install pyBigWig",
        )

    ok = bool(getattr(pyBigWig, "remote", 0))
    if ok:
        detail = (
            "pyBigWig was built with libcurl; remote .bw/.bigWig URLs are supported."
        )
        fix = ""
    else:
        detail = (
            "pyBigWig was built WITHOUT libcurl; "
            "remote BigWig signal tracks will fail to open."
        )
        fix = (
            "Install a curl-enabled build, e.g. install libcurl "
            "and then run `pip install --no-binary pyBigWig pyBigWig`"
        )
    return CapabilityResult(
        name="pybigwig-remote",
        required_for="remote BigWig signal tracks",
        ok=ok,
        detail=detail,
        fix_hint=fix,
    )


# --------------------------------------------------------------------------- #
#  Startup
# --------------------------------------------------------------------------- #
def warn_on_missing_remote_capabilities() -> List[CapabilityResult]:
    results = run_capability_checks()
    missing = [r for r in results if r.ok is False]
    unknown = [r for r in results if r.ok is None]

    if not missing and not unknown:
        logger.info(
            "Remote datasets enabled; all %d optional capabilities available.",
            len(results),
        )
        return results

    logger.warning(
        "Remote datasets are ENABLED but %d capability(ies) are unavailable. "
        "Affected features will error for remote datasets:",
        len(missing) + len(unknown),
    )
    for r in missing + unknown:
        state = "MISSING" if r.ok is False else "UNKNOWN"
        logger.warning("  [%s] %s — required for: %s", state, r.name, r.required_for)
        logger.warning("        %s", r.detail)
        if r.fix_hint:
            logger.warning("        fix: %s", r.fix_hint)
    return results
