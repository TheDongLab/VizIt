import io
import ipaddress
import json
import os
import socket
from functools import lru_cache
from urllib.parse import urljoin, urlsplit, quote

import requests
import toml

from backend.settings import settings

DATASETS_DIR = os.path.join("backend", "datasets")

# Networking limits for remote fetches.
REMOTE_TIMEOUT = 30  # seconds per request
MAX_REMOTE_BYTES = 1024 * 1024 * 1024  # 1 GiB cap for whole-file downloads
MAX_REDIRECTS = 3


class RemoteDatasetError(Exception):
    pass


def is_remote(dataset) -> bool:
    return isinstance(dataset, str) and (
        dataset.startswith("http://") or dataset.startswith("https://")
    )


# --------------------------------------------------------------------------- #
#  SSRF protection
# --------------------------------------------------------------------------- #
def _allowed_hosts() -> set:
    raw = getattr(settings, "remote_dataset_allowed_hosts", "") or ""
    return {h.strip().lower() for h in raw.split(",") if h.strip()}


def _ip_is_public(ip_text: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_text)
    except ValueError:
        return False

    # Unwrap IPv4-mapped / 6to4-style addresses so 127.0.0.1 can't be hidden as ::ffff:127.0.0.1
    if ip.version == 6 and getattr(ip, "ipv4_mapped", None) is not None:
        ip = ip.ipv4_mapped
    if (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    ):
        return False
    return bool(ip.is_global)


def _resolve_ips(host: str) -> set:
    infos = socket.getaddrinfo(host, None)
    return {info[4][0] for info in infos}


def assert_safe_url(url: str) -> str:
    if not getattr(settings, "allow_remote_datasets", True):
        raise RemoteDatasetError("Remote datasets are disabled on this server.")

    parts = urlsplit(url)
    if parts.scheme not in ("http", "https"):
        raise RemoteDatasetError(f"Unsupported URL scheme: {parts.scheme!r}")
    host = parts.hostname
    if not host:
        raise RemoteDatasetError("Remote dataset URL has no host.")

    allow = _allowed_hosts()
    if allow and host.lower() not in allow:
        raise RemoteDatasetError(f"Host '{host}' is not in the allowed-hosts list.")

    if getattr(settings, "remote_dataset_allow_private", False):
        return url

    try:
        ips = _resolve_ips(host)
    except socket.gaierror as exc:
        raise RemoteDatasetError(f"Could not resolve host '{host}': {exc}")
    if not ips:
        raise RemoteDatasetError(f"Could not resolve host '{host}'.")
    for ip in ips:
        if not _ip_is_public(ip):
            raise RemoteDatasetError(
                f"Refusing to access non-public address {ip} (host '{host}')."
            )
    return url


# --------------------------------------------------------------------------- #
#  HTTP helpers
# --------------------------------------------------------------------------- #
def _request(method: str, url: str, **kwargs):
    """Issue a request, re-validating the target on every redirect hop."""
    assert_safe_url(url)
    current = url
    for _ in range(MAX_REDIRECTS + 1):
        resp = requests.request(
            method,
            current,
            allow_redirects=False,
            timeout=REMOTE_TIMEOUT,
            **kwargs,
        )
        if resp.status_code in (301, 302, 303, 307, 308):
            location = resp.headers.get("Location")
            resp.close()
            if not location:
                raise RemoteDatasetError("Redirect response without a Location header.")
            current = urljoin(current, location)
            assert_safe_url(current)
            continue
        return resp
    raise RemoteDatasetError("Too many redirects while fetching remote dataset file.")


def _remote_exists(url: str) -> bool:
    try:
        resp = _request("GET", url, stream=True, headers={"Range": "bytes=0-0"})
    except RemoteDatasetError:
        raise
    except requests.RequestException:
        return False
    try:
        return resp.status_code < 400
    finally:
        resp.close()


def clear_remote_cache() -> None:
    _fetch_bytes_cached.cache_clear()


@lru_cache(maxsize=512)
def _fetch_bytes_cached(url: str) -> bytes:
    try:
        resp = _request("GET", url, stream=True)
    except requests.RequestException as exc:
        raise RemoteDatasetError(f"Failed to fetch {url}: {exc}")

    with resp:
        if resp.status_code == 404:
            raise FileNotFoundError(url)
        if resp.status_code >= 400:
            raise RemoteDatasetError(
                f"Remote returned HTTP {resp.status_code} for {url}"
            )

        total = 0
        chunks = []
        for chunk in resp.iter_content(chunk_size=1 << 16):
            if not chunk:
                continue
            total += len(chunk)
            if total > MAX_REMOTE_BYTES:
                raise RemoteDatasetError(
                    f"Remote file {url} exceeds the {MAX_REMOTE_BYTES} byte limit."
                )
            chunks.append(chunk)
        return b"".join(chunks)


# --------------------------------------------------------------------------- #
#  Path / URL building
# --------------------------------------------------------------------------- #
def _local_path(dataset: str, parts) -> str:
    return os.path.join(DATASETS_DIR, dataset, *parts)


def _remote_url(dataset: str, parts) -> str:
    base = dataset.rstrip("/")
    suffix = "/".join(quote(str(p), safe="") for p in parts)
    return f"{base}/{suffix}" if suffix else base


def ds_locator(dataset: str, *parts) -> str:
    if is_remote(dataset):
        return assert_safe_url(_remote_url(dataset, parts))
    return _local_path(dataset, parts)


def ds_exists(dataset: str, *parts) -> bool:
    if is_remote(dataset):
        return _remote_exists(_remote_url(dataset, parts))
    return os.path.exists(_local_path(dataset, parts))


def ds_file_key(dataset: str, *parts):
    if is_remote(dataset):
        return _remote_url(dataset, parts)
    path = _local_path(dataset, parts)
    try:
        st = os.stat(path)
    except OSError:
        return None
    return (path, st.st_mtime_ns, st.st_size)


def ds_read_bytes(dataset: str, *parts):
    if is_remote(dataset):
        try:
            return _fetch_bytes_cached(_remote_url(dataset, parts))
        except FileNotFoundError:
            return None
    path = _local_path(dataset, parts)
    if not os.path.exists(path):
        return None
    with open(path, "rb") as fh:
        return fh.read()


def ds_read_text(dataset: str, *parts, encoding="utf-8"):
    data = ds_read_bytes(dataset, *parts)
    if data is None:
        return None
    return data.decode(encoding)


def ds_read_json(dataset: str, *parts):
    text = ds_read_text(dataset, *parts)
    if text is None:
        return None
    return json.loads(text)


def ds_read_toml(dataset: str, *parts):
    text = ds_read_text(dataset, *parts)
    if text is None:
        return None
    return toml.loads(text)


def ds_text_stream(dataset: str, *parts, encoding="utf-8"):
    if not is_remote(dataset):
        path = _local_path(dataset, parts)
        if not os.path.exists(path):
            return None
        return open(path, "r", encoding=encoding, newline="")

    text = ds_read_text(dataset, *parts, encoding=encoding)
    if text is None:
        return None
    return io.StringIO(text)


def ds_bytes_stream(dataset: str, *parts):
    if not is_remote(dataset):
        path = _local_path(dataset, parts)
        if not os.path.exists(path):
            return None
        return open(path, "rb")

    data = ds_read_bytes(dataset, *parts)
    if data is None:
        return None
    return io.BytesIO(data)
