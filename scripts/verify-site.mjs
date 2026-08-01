import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const canonicalRoot = resolve(root, "..", "output", "실습자료");
const pagePaths = [
  "index.html",
  "7/index.html",
  "9/index.html",
  "11/index.html",
];
const pages = new Map(
  pagePaths.map((path) => [path, readFileSync(resolve(root, path), "utf8")]),
);

const files = new Map([
  [
    "예제_다운로드_폴더.zip",
    {
      hash: "35dc36c2c4dc733d166919d7b5b35359bb7873d4ee5fa403dd6386e79f33b39c",
      page: "7/index.html",
    },
  ],
  [
    "결과확인표.pdf",
    {
      hash: "f0cdb10419e4686f089d2201fe8a1a05b54d7841dca924074bc9d686bf6fad98",
      page: "7/index.html",
    },
  ],
  [
    "예제_녹음.m4a",
    {
      hash: "75c3ffa6d9ac2fd994bb20e191f1c693242f707a10beb99b8e80ee71de7a2bbb",
      page: "9/index.html",
    },
  ],
  [
    "예제_녹음_모음.zip",
    {
      hash: "500260957725c15f00ff69eac324760a661f37aa25c3b2dc0ae9ece3e4df1571",
      page: "11/index.html",
    },
  ],
]);

const sha256 = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

const errors = [];

for (const [path, html] of pages) {
  if (!html.includes('lang="ko"')) {
    errors.push(`HTML 문서 언어가 "ko"가 아님: ${path}`);
  }

  if (!html.includes('href="#main"')) {
    errors.push(`본문 바로가기 링크 없음: ${path}`);
  }
}

const homeHtml = pages.get("index.html") ?? "";

for (const chapter of ["7", "9", "11"]) {
  if (!homeHtml.includes(`href="/${chapter}/"`)) {
    errors.push(`홈의 장 선택 링크 없음: ${chapter}장`);
  }
}

if (homeHtml.includes("/downloads/")) {
  errors.push("홈에 다운로드 링크가 노출됨");
}

if (homeHtml.includes('href="/4/"') || existsSync(resolve(root, "4", "index.html"))) {
  errors.push("자료가 없는 4장 페이지가 노출됨");
}

for (const [file, expected] of files) {
  const deployed = resolve(root, "downloads", file);
  const canonical = resolve(canonicalRoot, file);
  const expectedPageHtml = pages.get(expected.page) ?? "";

  if (!existsSync(deployed)) {
    errors.push(`배포 파일 없음: ${file}`);
    continue;
  }

  if (!expectedPageHtml.includes(`/downloads/${file}`)) {
    errors.push(`장별 다운로드 링크 없음: ${file} → ${expected.page}`);
  }

  const deployedHash = sha256(deployed);

  if (deployedHash !== expected.hash) {
    errors.push(`검수 완료 해시와 내용 불일치: ${file}`);
  }

  if (existsSync(canonical) && deployedHash !== sha256(canonical)) {
    errors.push(`제작 정본과 내용 불일치: ${file}`);
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}

console.log(`✓ 장별 페이지 ${pages.size}개와 실습자료 ${files.size}종 검증 통과`);
