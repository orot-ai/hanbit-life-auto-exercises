import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const exerciseRoot = resolve(root, "..", "output", "실습자료");
const canonicalRoot = resolve(exerciseRoot, "제작원본");
const pagePaths = ["index.html", "5/index.html", "6/index.html"];
const pages = new Map(pagePaths.map((path) => [path, readFileSync(resolve(root, path), "utf8")]));
const vercelConfig = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
const vercelIgnore = new Set(readFileSync(resolve(root, ".vercelignore"), "utf8").split("\n").map((line) => line.trim()).filter(Boolean));
const errors = [];

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const requireText = (html, needle, description) => {
  if (!html.includes(needle)) errors.push(description);
};

for (const [path, html] of pages) {
  requireText(html, 'lang="ko"', `HTML 문서 언어가 ko가 아님: ${path}`);
  requireText(html, 'name="viewport"', `viewport 메타 태그 없음: ${path}`);
  requireText(html, 'href="#main"', `본문 바로가기 링크 없음: ${path}`);
}

const home = pages.get("index.html") ?? "";
const chapter = pages.get("5/index.html") ?? "";
const chapter6 = pages.get("6/index.html") ?? "";
requireText(home, 'href="/5/"', "홈의 5장 링크 없음");
requireText(home, 'href="/6/"', "홈의 6장 링크 없음");
requireText(home, "문서 하나로 첫 대시보드를 만듭니다", "홈의 5장 제목 불일치");
requireText(home, "다운로드 폴더는 왜 항상 엉망이 될까?", "홈의 6장 제목 불일치");
if (home.includes("/downloads/")) errors.push("홈에 다운로드 링크가 노출됨");

for (const phrase of ["PRD 내려받기", "코덱스에 건네기", "HTML 목업 만들기", "브라우저에서 확인하기"]) {
  requireText(chapter, phrase, `5장 실습 순서 누락: ${phrase}`);
}
requireText(chapter, 'href="/downloads/인생자동화대시보드_PRD.md"', "5장 PRD 다운로드 링크 없음");
requireText(chapter, "대시보드 PRD 내려받기", "5장 PRD 버튼 문구 불일치");
requireText(chapter, 'href="/5/example/"', "5장 완성 예시 링크 없음");
requireText(chapter, "실제 저장, 메일 전송, 캘린더 연결 기능이 없는 화면 목업", "목업 제한 안내 없음");

requireText(chapter6, 'href="/downloads/예제_다운로드_폴더.zip"', "6장 예제 ZIP 링크 없음");
requireText(chapter6, "예제 파일 내려받기", "6장 예제 ZIP 버튼 문구 불일치");
requireText(chapter6, 'href="/downloads/결과확인표.pdf"', "6장 결과확인표 링크 없음");
requireText(chapter6, "결과확인표 내려받기", "6장 결과확인표 버튼 문구 불일치");
requireText(chapter6, "실습 중에는 ZIP 파일을 그대로 보존합니다", "6장 ZIP 보존 안내 없음");
requireText(chapter6, "정답지가 아니라", "6장 결과확인표 역할 안내 없음");

const assets = [
  {
    deployed: resolve(root, "downloads", "인생자동화대시보드_PRD.md"),
    canonical: resolve(canonicalRoot, "인생자동화대시보드_PRD.md"),
    expectedHash: "2c303258ac73ec51894474c06a228539464262ba48b9d88d1865685b660d4c26",
    label: "PRD",
  },
  {
    deployed: resolve(root, "5", "example", "index.html"),
    canonical: resolve(canonicalRoot, "인생자동화대시보드", "index.html"),
    expectedHash: "f6d76b61b898ceb19bf642a6ce3be67156b2f244f04841b02b8b4abe0ff40519",
    label: "완성 목업",
  },
  {
    deployed: resolve(root, "downloads", "예제_다운로드_폴더.zip"),
    canonical: resolve(exerciseRoot, "예제_다운로드_폴더.zip"),
    expectedHash: "35dc36c2c4dc733d166919d7b5b35359bb7873d4ee5fa403dd6386e79f33b39c",
    label: "6장 예제 ZIP",
  },
  {
    deployed: resolve(root, "downloads", "결과확인표.pdf"),
    canonical: resolve(exerciseRoot, "결과확인표.pdf"),
    expectedHash: "f0cdb10419e4686f089d2201fe8a1a05b54d7841dca924074bc9d686bf6fad98",
    label: "6장 결과확인표",
  },
];

for (const asset of assets) {
  if (!existsSync(asset.deployed) || !existsSync(asset.canonical)) {
    errors.push(`${asset.label} 제작 정본 또는 배포본 없음`);
    continue;
  }
  const deployedHash = sha256(asset.deployed);
  if (deployedHash !== sha256(asset.canonical)) errors.push(`${asset.label} 제작 정본과 배포본 불일치`);
  if (deployedHash !== asset.expectedHash) errors.push(`${asset.label} 검수 해시 불일치`);
}

const downloadNames = readdirSync(resolve(root, "downloads")).filter((name) => statSync(resolve(root, "downloads", name)).isFile()).sort();
const expectedDownloads = ["결과확인표.pdf", "예제_다운로드_폴더.zip", "인생자동화대시보드_PRD.md"].sort();
if (downloadNames.join("\n") !== expectedDownloads.join("\n")) errors.push(`공개 다운로드 범위 불일치: ${downloadNames.join(", ")}`);

for (const removedChapter of ["7", "9", "11"]) {
  if (existsSync(resolve(root, removedChapter))) errors.push(`제거 대상 장 디렉터리가 남음: ${removedChapter}`);
}

const requestPromptName = "인생자동화대시보드_PRD_요청프롬프트.md";
if (existsSync(resolve(root, "downloads", requestPromptName)) || chapter.includes(requestPromptName)) errors.push("원고용 요청 프롬프트가 사이트 다운로드로 노출됨");

if (vercelConfig.cleanUrls !== true || vercelConfig.trailingSlash !== true) errors.push("Vercel cleanUrls/trailingSlash 계약이 true가 아님");
const redirects = new Map((vercelConfig.redirects ?? []).map((item) => [item.source, item.destination]));
if (redirects.size !== 2 || redirects.get("/chapter/05/") !== "/5/" || redirects.get("/chapter/06/") !== "/6/") errors.push("Vercel redirect는 5장과 6장만 허용됨");

for (const deploymentOnlyPath of [".git", ".github", ".vercel", ".gitattributes", "scripts", "*.md"]) {
  if (!vercelIgnore.has(deploymentOnlyPath)) errors.push(`Vercel 배포 제외 누락: ${deploymentOnlyPath}`);
}

const publicHtml = [...pages.values()].join("\n");
for (const forbidden of ["예제_녹음.m4a", "예제_녹음_모음.zip"]) {
  if (publicHtml.includes(forbidden)) errors.push(`제거 대상 다운로드 링크가 남음: ${forbidden}`);
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}

console.log(`✓ 실습자료 페이지 ${pages.size}개와 완성 목업, 다운로드 3종, 제작 정본 4종, redirect 2개 검증 통과`);
