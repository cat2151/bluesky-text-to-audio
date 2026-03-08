"""
ym2151関連のベンダリング済みライブラリをGitHub Pagesからダウンロードして同期する。

各ライブラリはGitHub Pagesにビルド成果物として公開されており、
対応するGitHubリポジトリのmainブランチのコミットSHAで更新を検出する。

使い方:
  python sync_vendor_ym2151.py

環境変数:
  GH_TOKEN       : GitHub API トークン (必須)
  GITHUB_OUTPUT  : GitHub Actions の output ファイルパス

終了コード:
  0: 正常終了 (最新またはファイルを更新済み)
  1: エラー
"""

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

SHA_PATTERN = re.compile(r"^[0-9a-f]{40}$")

# 各ライブラリの設定
# (upstream_repo, js_header_file, js_pages_url, wasm_pages_url, wasm_local_path)
LIBRARIES = [
    {
        "name": "web-ym2151",
        "upstream_repo": "cat2151/web-ym2151",
        "js_file": "src/web-ym2151/ym2151.js",
        "header_lines": 11,
        "downloads": [
            {
                "url": "https://cat2151.github.io/web-ym2151/ym2151.js",
                "local": "src/web-ym2151/ym2151.js",
                "binary": False,
            },
            {
                "url": "https://cat2151.github.io/web-ym2151/ym2151.wasm",
                "local": "src/web-ym2151/ym2151.wasm",
                "binary": True,
            },
        ],
    },
    {
        "name": "smf-to-ym2151log-rust",
        "upstream_repo": "cat2151/smf-to-ym2151log-rust",
        "js_file": "src/smf-to-ym2151log-rust/pkg/smf_to_ym2151log.js",
        "header_lines": 11,
        "downloads": [
            {
                "url": "https://cat2151.github.io/smf-to-ym2151log-rust/pkg/smf_to_ym2151log.js",
                "local": "src/smf-to-ym2151log-rust/pkg/smf_to_ym2151log.js",
                "binary": False,
            },
            {
                "url": "https://cat2151.github.io/smf-to-ym2151log-rust/pkg/smf_to_ym2151log_bg.wasm",
                "local": "src/smf-to-ym2151log-rust/pkg/smf_to_ym2151log_bg.wasm",
                "binary": True,
            },
            {
                "url": "https://cat2151.github.io/smf-to-ym2151log-rust/pkg/smf_to_ym2151log.d.ts",
                "local": "src/smf-to-ym2151log-rust/pkg/smf_to_ym2151log.d.ts",
                "binary": False,
            },
        ],
    },
    {
        "name": "mmlabc-to-smf-wasm",
        "upstream_repo": "cat2151/mmlabc-to-smf-rust",
        "js_file": "src/mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm.js",
        "header_lines": 11,
        "downloads": [
            {
                "url": "https://cat2151.github.io/mmlabc-to-smf-rust/mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm.js",
                "local": "src/mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm.js",
                "binary": False,
            },
            {
                "url": "https://cat2151.github.io/mmlabc-to-smf-rust/mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm_bg.wasm",
                "local": "src/mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm_bg.wasm",
                "binary": True,
            },
            {
                "url": "https://cat2151.github.io/mmlabc-to-smf-rust/mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm.d.ts",
                "local": "src/mmlabc-to-smf-wasm/pkg/mmlabc_to_smf_wasm.d.ts",
                "binary": False,
            },
            {
                "url": "https://cat2151.github.io/mmlabc-to-smf-rust/tree-sitter-mml/tree-sitter-mml.wasm",
                "local": "src/mmlabc-tree-sitter-mml/tree-sitter-mml.wasm",
                "binary": True,
            },
        ],
    },
]


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


def download_url(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "sync-vendor-ym2151"})
    with urllib.request.urlopen(req) as resp:
        return resp.read()


def sync_library(lib: dict, token: str) -> bool:
    """ライブラリを同期し、更新された場合は True を返す。"""
    name = lib["name"]
    upstream_repo = lib["upstream_repo"]
    js_file = Path(lib["js_file"])
    header_lines = lib["header_lines"]

    # ローカルJSファイルのヘッダーから記録済みSHAを取得
    recorded_sha = get_recorded_sha(js_file)
    validate_sha(recorded_sha, f"{name} RECORDED_SHA")

    # GitHub APIでmainブランチの最新コミットSHAを取得
    try:
        data = github_api_get(f"repos/{upstream_repo}/commits/main", token)
    except Exception as e:
        print(f"ERROR: {name} の GitHub API 呼び出しに失敗しました: {e}", file=sys.stderr)
        sys.exit(1)

    current_sha = data.get("sha", "")
    validate_sha(current_sha, f"{name} CURRENT_SHA")

    print(f"{name}: recorded={recorded_sha[:8]} current={current_sha[:8]}")

    if recorded_sha == current_sha:
        return False

    print(f"{name}: 更新を検出 ({recorded_sha[:8]} -> {current_sha[:8]})、ダウンロード中...")

    # すべてのファイルをダウンロード
    for dl in lib["downloads"]:
        url = dl["url"]
        local_path = Path(dl["local"])
        is_binary = dl["binary"]

        print(f"  ダウンロード: {url}")
        try:
            content = download_url(url)
        except Exception as e:
            print(f"ERROR: {url} のダウンロードに失敗しました: {e}", file=sys.stderr)
            sys.exit(1)

        if is_binary:
            local_path.write_bytes(content)
        else:
            # テキストファイル: ヘッダー保持 + SHA更新 + 新しいコンテンツ
            text = content.decode("utf-8")
            original_lines = js_file.read_text().splitlines(keepends=True)
            if local_path == js_file:
                # JSファイル自身: ヘッダーのSHAを更新してから新しいコンテンツを付加
                header = "".join(
                    re.sub(r"(// Upstream-SHA:\s*)\S+", rf"\g<1>{current_sha}", line)
                    if "Upstream-SHA:" in line
                    else line
                    for line in original_lines[:header_lines]
                )
                local_path.write_text(header + text)
            else:
                # 別ファイル（.d.ts等）はそのまま保存
                local_path.write_text(text)

    print(f"{name}: {recorded_sha[:8]} -> {current_sha[:8]} に更新完了")
    return True


def main() -> None:
    token = os.environ.get("GH_TOKEN", "")
    if not token:
        print("ERROR: GH_TOKEN が設定されていません", file=sys.stderr)
        sys.exit(1)

    any_updated = False
    old_shas: dict[str, str] = {}
    new_shas: dict[str, str] = {}

    for lib in LIBRARIES:
        name = lib["name"]
        js_file = Path(lib["js_file"])

        old_sha = get_recorded_sha(js_file)
        old_shas[name] = old_sha

        updated = sync_library(lib, token)
        if updated:
            any_updated = True
            new_sha = get_recorded_sha(js_file)
            new_shas[name] = new_sha
        else:
            new_shas[name] = old_sha

    if any_updated:
        write_github_output("updated", "true")
        # 変更サマリーを出力
        for lib in LIBRARIES:
            name = lib["name"]
            old = old_shas[name]
            new = new_shas[name]
            if old != new:
                write_github_output(f"{name.replace('-', '_')}_old_sha", old[:8])
                write_github_output(f"{name.replace('-', '_')}_new_sha", new[:8])
    else:
        write_github_output("updated", "false")
        print("すべてのym2151ライブラリは最新です。")


if __name__ == "__main__":
    main()
