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
const vercelConfig = JSON.parse(
  readFileSync(resolve(root, "vercel.json"), "utf8"),
);
const vercelIgnore = new Set(
  readFileSync(resolve(root, ".vercelignore"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean),
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

if (vercelConfig.cleanUrls !== true || vercelConfig.trailingSlash !== true) {
  errors.push("Vercel cleanUrls/trailingSlash 계약이 true가 아님");
}

const expectedRedirects = new Map([
  ["/chapter/04/", "/"],
  ["/4/", "/"],
  ["/chapter/05/", "/"],
  ["/chapter/06/", "/7/"],
  ["/chapter/07/", "/7/"],
  ["/chapter/08/", "/9/"],
  ["/chapter/09/", "/9/"],
  ["/chapter/11/", "/11/"],
]);
const actualRedirects = new Map(
  (vercelConfig.redirects ?? []).map((redirect) => [
    redirect.source,
    redirect.destination,
  ]),
);

for (const [source, destination] of expectedRedirects) {
  if (actualRedirects.get(source) !== destination) {
    errors.push(`Vercel redirect 계약 불일치: ${source} → ${destination}`);
  }
}

for (const deploymentOnlyPath of [
  ".git",
  ".github",
  ".vercel",
  ".gitattributes",
  "scripts",
  "*.md",
]) {
  if (!vercelIgnore.has(deploymentOnlyPath)) {
    errors.push(`Vercel 배포 제외 누락: ${deploymentOnlyPath}`);
  }
}

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

console.log(
  `✓ 장별 페이지 ${pages.size}개, 실습자료 ${files.size}종, ` +
    `배포 redirect ${expectedRedirects.size}개 검증 통과`,
);
