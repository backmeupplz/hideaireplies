"""Submits hideaireplies.zip to one store: python3 scripts/publish.py chrome|firefox VERSION

A newer release replaces an older version that is still waiting for review (owner rule), and rerunning a
release that already reached the store is a no-op.
"""
import base64, hashlib, hmac, json, os, sys, time, uuid
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ZIP = "hideaireplies.zip"


def call(url, auth, method="GET", body=None, content_type="application/json", missing=False):
    if isinstance(body, dict):
        body = json.dumps(body).encode()
    req = Request(url, data=body, method=method, headers={"Authorization": auth, "Content-Type": content_type})
    try:
        with urlopen(req, timeout=120) as r:
            return json.loads(r.read() or b"{}")
    except HTTPError as e:
        if missing and e.code == 404:
            return None
        sys.exit(f"{method} {url} -> {e.code}: {e.read()[:2000].decode(errors='replace')}")


def older(a, b):
    return tuple(map(int, a.split("."))) < tuple(map(int, b.split(".")))


def chrome(version):
    auth = "Bearer " + os.environ["GOOGLE_ACCESS_TOKEN"]
    name = f"publishers/{os.environ['CHROME_PUBLISHER_ID']}/items/{os.environ['CHROME_ITEM_ID']}"
    base = "https://chromewebstore.googleapis.com/v2/" + name
    status = call(base + ":fetchStatus", auth)
    for key in ("submittedItemRevisionStatus", "publishedItemRevisionStatus"):
        rev = status.get(key) or {}
        if version in [c.get("crxVersion") for c in rev.get("distributionChannels", [])] and rev.get("state") != "REJECTED":
            return print(f"Chrome already has {version}: {rev.get('state')}")
    pending = status.get("submittedItemRevisionStatus") or {}
    if pending.get("state") == "PENDING_REVIEW":
        versions = [c.get("crxVersion") for c in pending.get("distributionChannels", [])]
        if not all(older(v, version) for v in versions):
            sys.exit(f"Chrome is reviewing {versions}, which is not older than {version}")
        call(base + ":cancelSubmission", auth, method="POST", body={})
        for _ in range(60):  # Chrome refuses a new publish until the cancelled review is gone
            if (call(base + ":fetchStatus", auth).get("submittedItemRevisionStatus") or {}).get("state") != "PENDING_REVIEW":
                break
            time.sleep(10)
    with open(ZIP, "rb") as f:
        up = call("https://chromewebstore.googleapis.com/upload/v2/" + name + ":upload", auth, method="POST", body=f.read(), content_type="application/zip")
    state = up.get("uploadState")
    for _ in range(30):
        if state != "IN_PROGRESS":
            break
        time.sleep(10)
        state = call(base + ":fetchStatus", auth).get("lastAsyncUploadState")
    if state != "SUCCEEDED":
        sys.exit(f"Chrome upload ended {state}: {up}")
    res = call(base + ":publish", auth, method="POST", body={"publishType": "DEFAULT_PUBLISH", "deployInfos": [{"deployPercentage": 100}]})
    if res.get("state") not in ("PENDING_REVIEW", "PUBLISHED"):
        sys.exit(f"Chrome publish returned {res}")
    print(f"Chrome {version}: {res['state']}")


def amo_auth():
    enc = lambda o: base64.urlsafe_b64encode(json.dumps(o, separators=(",", ":")).encode()).rstrip(b"=")
    now = int(time.time())
    data = enc({"alg": "HS256", "typ": "JWT"}) + b"." + enc({"iss": os.environ["AMO_JWT_ISSUER"], "jti": uuid.uuid4().hex, "iat": now, "exp": now + 300})
    sig = base64.urlsafe_b64encode(hmac.new(os.environ["AMO_JWT_SECRET"].encode(), data, hashlib.sha256).digest()).rstrip(b"=")
    return "JWT " + (data + b"." + sig).decode()


def multipart(fields, files):
    boundary = uuid.uuid4().hex
    out = b""
    for k, v in fields.items():
        out += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    for k, path in files.items():
        with open(path, "rb") as f:
            out += f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{os.path.basename(path)}"\r\nContent-Type: application/zip\r\n\r\n'.encode() + f.read() + b"\r\n"
    return out + f"--{boundary}--\r\n".encode(), "multipart/form-data; boundary=" + boundary


def firefox(version):
    base = "https://addons.mozilla.org/api/v5/addons/"
    addon = base + "addon/hideaireplies%40borodutch.com/"
    if call(addon + f"versions/v{version}/", amo_auth(), missing=True):
        return print(f"AMO already has {version}")
    listed = call(addon + "versions/?filter=all_without_unlisted&page_size=50", amo_auth())["results"]
    for v in listed:
        if v.get("file", {}).get("status") == "unreviewed" and not v.get("is_disabled"):
            if not older(v["version"], version):
                sys.exit(f"AMO is reviewing {v['version']}, which is not older than {version}")
            call(addon + f"versions/{v['id']}/", amo_auth(), method="PATCH", body={"is_disabled": True})
    body, kind = multipart({"channel": "listed"}, {"upload": ZIP})
    upload = call(base + "upload/", amo_auth(), method="POST", body=body, content_type=kind)
    for _ in range(60):
        upload = call(base + "upload/" + upload["uuid"] + "/", amo_auth())
        if upload.get("processed"):
            break
        time.sleep(10)
    if not upload.get("valid"):
        sys.exit(f"AMO validation failed: {json.dumps(upload.get('validation'))[:3000]}")
    res = call(addon + "versions/", amo_auth(), method="POST", body={"upload": upload["uuid"], "license": "MIT"})
    print(f"AMO {version}: {res.get('file', {}).get('status')}")


if __name__ == "__main__":
    {"chrome": chrome, "firefox": firefox}[sys.argv[1]](sys.argv[2])
