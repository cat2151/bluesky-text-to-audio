"""
ベンダリング済みライブラリのアップストリームSHAを確認し、
更新があれば自動でファイルを同期する。

使い方:
  python sync_vendor.py <upstream_repo> <upstream_file> <local_file> <header_lines>

引数:
  upstream_repo  : GitHubリポジトリ名 (例: cat2151/chord2mml)
  upstream_file  : アップストリームのファイルパス (例: dist/chord2mml.mjs)
  local_file     : ローカルのファイルパス (例: src/vendor/chord2mml.mjs)
  header_lines   : ローカルファイルの保持するヘッダー行数 (例: 12)

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


SHA_PATTERN = re.compile(r"^[0-9a-f]{40}$")


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


def sync_vendor(upstream_repo: str, upstream_file: str, local_file: Path, header_lines: int) -> None:
    token = os.environ.get("GH_TOKEN", "")
    if not token:
        print("ERROR: GH_TOKEN が設定されていません", file=sys.stderr)
        sys.exit(1)

    # ローカルファイルのヘッダーから記録済みSHAを取得
    recorded_sha = get_recorded_sha(local_file)
    validate_sha(recorded_sha, "RECORDED_SHA")

    # GitHub API で現在のアップストリームファイルの blob SHA を取得
    api_path = f"repos/{upstream_repo}/contents/{upstream_file}"
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

    # アップストリームのファイル内容をデコード
    content_b64 = data.get("content", "").replace("\n", "")

    # ヘッダー（SHA更新済み）+ アップストリームコンテンツでファイルを再構築
    original_lines = local_file.read_text().splitlines(keepends=True)
    header = "".join(
        re.sub(r"(// Upstream-SHA:\s*)\S+", rf"\g<1>{current_sha}", line)
        if "Upstream-SHA:" in line else line
        for line in original_lines[:header_lines]
    )
    upstream_text = base64.b64decode(content_b64).decode("utf-8")
    local_file.write_text(header + upstream_text)

    write_github_output("updated", "true")
    write_github_output("recorded_sha", recorded_sha)
    write_github_output("current_sha", current_sha)
    print(f"{lib_name} を {recorded_sha} -> {current_sha} に更新しました")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(f"使い方: {sys.argv[0]} <upstream_repo> <upstream_file> <local_file> <header_lines>", file=sys.stderr)
        sys.exit(1)

    upstream_repo = sys.argv[1]
    upstream_file = sys.argv[2]
    local_file = Path(sys.argv[3])
    header_lines = int(sys.argv[4])

    sync_vendor(upstream_repo, upstream_file, local_file, header_lines)
