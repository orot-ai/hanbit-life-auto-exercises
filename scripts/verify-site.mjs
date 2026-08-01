import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const canonicalRoot = resolve(root, "..", "output", "실습자료");
const html = readFileSync(resolve(root, "index.html"), "utf8");

const files = new Map([
  [
    "예제_다운로드_폴더.zip",
    "35dc36c2c4dc733d166919d7b5b35359bb7873d4ee5fa403dd6386e79f33b39c",
  ],
  [
    "결과확인표.pdf",
    "f0cdb10419e4686f089d2201fe8a1a05b54d7841dca924074bc9d686bf6fad98",
  ],
  [
    "예제_녹음.m4a",
    "75c3ffa6d9ac2fd994bb20e191f1c693242f707a10beb99b8e80ee71de7a2bbb",
  ],
  [
    "예제_녹음_모음.zip",
    "500260957725c15f00ff69eac324760a661f37aa25c3b2dc0ae9ece3e4df1571",
  ],
]);

const sha256 = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

const errors = [];

for (const [file, expectedHash] of files) {
  const deployed = resolve(root, "downloads", file);
  const canonical = resolve(canonicalRoot, file);

  if (!existsSync(deployed)) {
    errors.push(`배포 파일 없음: ${file}`);
    continue;
  }

  if (!html.includes(`/downloads/${file}`)) {
    errors.push(`HTML 다운로드 링크 없음: ${file}`);
  }

  const deployedHash = sha256(deployed);

  if (deployedHash !== expectedHash) {
    errors.push(`검수 완료 해시와 내용 불일치: ${file}`);
  }

  if (existsSync(canonical) && deployedHash !== sha256(canonical)) {
    errors.push(`제작 정본과 내용 불일치: ${file}`);
  }
}

if (!html.includes('lang="ko"')) {
  errors.push('HTML 문서 언어가 "ko"가 아님');
}

if (!html.includes('href="#downloads"')) {
  errors.push("본문 바로가기 링크 없음");
}

if (errors.length > 0) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}

console.log(`✓ HTML과 실습자료 ${files.size}종 검증 통과`);
