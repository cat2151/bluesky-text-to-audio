"""
tonejs-json-sequencer のベンダリング済みバンドルを最新の upstream と同期する。

複数の ESM ファイルを 1 つのファイルに結合するため、
sync_vendor.py とは別スクリプトとして実装する。

使い方:
  python sync_vendor_sequencer.py <local_file>

引数:
  local_file     : ローカルのファイルパス (例: src/tonejs-json-sequencer.mjs)

環境変数:
  GH_TOKEN       : GitHub API トークン (必須)
  GITHUB_OUTPUT  : GitHub Actions の output ファイルパス

終了コード:
  0: 正常終了 (最新またはファイルを更新済み)
  1: エラー (不正なSHA、APIエラー等)
"""

import base64
import json
import os
import re
import sys
import urllib.request
from pathlib import Path


UPSTREAM_REPO = "cat2151/tonejs-json-sequencer"
# The representative file whose SHA we track
INDEX_FILE = "dist/index.mjs"
# Files to download and inline (in order)
ESM_FILES = [
    ("dist/esm/sequencer-nodes.mjs", "from dist/esm/sequencer-nodes.mjs"),
    ("dist/esm/factories/instrument-factory.mjs", "from dist/esm/factories/instrument-factory.mjs"),
    ("dist/esm/factories/effect-factory.mjs", "from dist/esm/factories/effect-factory.mjs"),
    ("dist/esm/node-factory.mjs", "from dist/esm/node-factory.mjs"),
    ("dist/esm/event-scheduler.mjs", "from dist/esm/event-scheduler.mjs"),
]
# Import lines to remove (they are inlined)
IMPORT_LINES_TO_REMOVE = [
    "import { createInstrument } from './factories/instrument-factory.mjs';",
    "import { createEffect } from './factories/effect-factory.mjs';",
    "import { createNode, connectNode } from './node-factory.mjs';",
]

SHA_PATTERN = re.compile(r"^[0-9a-f]{40}$")
HEADER_LINES = 16  # Number of header lines to preserve in local file


def validate_sha(sha: str, label: str) -> None:
    if not SHA_PATTERN.match(sha):
        print(f"ERROR: {label} が不正です: '{sha}'", file=sys.stderr)
        sys.exit(1)


def github_api_get(path: str, token: str) -> dict:
    url = f"https://api.github.com/{path}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def write_github_output(key: str, value: str) -> None:
    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a") as f:
            f.write(f"{key}={value}\n")
    else:
        print(f"[output] {key}={value}")


def get_recorded_sha(local_file: Path) -> str:
    for line in local_file.read_text().splitlines():
        if line.startswith("// Upstream-SHA:"):
            return line.split()[-1]
    print(f"ERROR: {local_file} に '// Upstream-SHA:' 行が見つかりません", file=sys.stderr)
    sys.exit(1)


def fetch_file_content(file_path: str, token: str) -> str:
    api_path = f"repos/{UPSTREAM_REPO}/contents/{file_path}"
    try:
        data = github_api_get(api_path, token)
    except Exception as e:
        print(f"ERROR: GitHub API 呼び出しに失敗しました ({file_path}): {e}", file=sys.stderr)
        sys.exit(1)
    content_b64 = data.get("content", "").replace("\n", "")
    return base64.b64decode(content_b64).decode("utf-8")


def remove_import_lines(content: str) -> str:
    """Remove inter-file import lines that are inlined."""
    lines = content.splitlines(keepends=True)
    result = []
    for line in lines:
        stripped = line.strip()
        if any(stripped == remove for remove in IMPORT_LINES_TO_REMOVE):
            continue
        result.append(line)
    return "".join(result)


def build_bundle(token: str, current_sha: str, local_file: Path) -> str:
    """Download all ESM files and build the combined bundle."""
    # Read existing header, updating the SHA
    original_lines = local_file.read_text().splitlines(keepends=True)
    header = "".join(
        re.sub(r"(// Upstream-SHA:\s*)\S+", rf"\g<1>{current_sha}", line)
        if "Upstream-SHA:" in line else line
        for line in original_lines[:HEADER_LINES]
    )

    # Download and combine each ESM file
    sections = []
    for file_path, section_label in ESM_FILES:
        print(f"  Downloading {file_path}...")
        content = fetch_file_content(file_path, token)
        content = remove_import_lines(content)
        sections.append(f"// === {section_label} ===\n{content}")

    return header + "\n".join(sections)


def sync_vendor_sequencer(local_file: Path) -> None:
    token = os.environ.get("GH_TOKEN", "")
    if not token:
        print("ERROR: GH_TOKEN が設定されていません", file=sys.stderr)
        sys.exit(1)

    # ローカルファイルのヘッダーから記録済みSHAを取得
    recorded_sha = get_recorded_sha(local_file)
    validate_sha(recorded_sha, "RECORDED_SHA")

    # GitHub API で現在のアップストリームファイルの blob SHA を取得
    api_path = f"repos/{UPSTREAM_REPO}/contents/{INDEX_FILE}"
    try:
        data = github_api_get(api_path, token)
    except Exception as e:
        print(f"ERROR: GitHub API 呼び出しに失敗しました: {e}", file=sys.stderr)
        sys.exit(1)

    current_sha = data.get("sha", "")
    validate_sha(current_sha, "CURRENT_SHA")

    lib_name = local_file.stem
    print(f"{lib_name}: recorded={recorded_sha} current={current_sha}")

    if recorded_sha == current_sha:
        write_github_output("updated", "false")
        return

    # バンドルを再生成
    print(f"{lib_name} を更新します: {recorded_sha} -> {current_sha}")
    bundle = build_bundle(token, current_sha, local_file)
    local_file.write_text(bundle)

    write_github_output("updated", "true")
    write_github_output("recorded_sha", recorded_sha)
    write_github_output("current_sha", current_sha)
    print(f"{lib_name} を {recorded_sha} -> {current_sha} に更新しました")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"使い方: {sys.argv[0]} <local_file>", file=sys.stderr)
        sys.exit(1)

    local_file = Path(sys.argv[1])
    sync_vendor_sequencer(local_file)
