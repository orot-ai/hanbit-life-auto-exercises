import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const exerciseRoot = resolve(root, "..", "output", "실습자료");
const canonicalRoot = resolve(exerciseRoot, "제작원본");
const pagePaths = ["index.html", "5/index.html", "6/index.html", "8/index.html", "11/index.html"];
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
const chapter8 = pages.get("8/index.html") ?? "";
const chapter11 = pages.get("11/index.html") ?? "";
requireText(home, 'href="/5/"', "홈의 5장 링크 없음");
requireText(home, 'href="/6/"', "홈의 6장 링크 없음");
requireText(home, 'href="/8/"', "홈의 8장 링크 없음");
requireText(home, 'href="/11/"', "홈의 11장 링크 없음");
requireText(home, "가져온 정보는 왜 바로 할 일이 아닐까?", "홈의 11장 제목 불일치");
requireText(home, "문서 하나로 첫 대시보드를 만듭니다", "홈의 5장 제목 불일치");
requireText(home, "다운로드 폴더는 왜 항상 엉망이 될까?", "홈의 6장 제목 불일치");
requireText(home, "녹음은 쌓이는데, 할 일은 어디로 갔을까?", "홈의 8장 제목 불일치");
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

requireText(chapter8, 'href="/downloads/예제_녹음.m4a"', "8장 예제 녹음 링크 없음");
requireText(chapter8, "예제 녹음 내려받기", "8장 예제 녹음 버튼 문구 불일치");
requireText(chapter8, "M4A는 휴대폰과 컴퓨터에서 재생할 수 있는 음원 파일", "8장 M4A 설명 없음");
requireText(chapter8, "일정과 자료 전달", "8장 녹음 내용 안내 없음");
requireText(chapter8, "약 92초", "8장 녹음 길이 안내 없음");

requireText(chapter11, 'href="/downloads/후속통화_예제.m4a"', "11장 후속 통화 다운로드 링크 없음");
requireText(chapter11, 'download="후속통화_예제.m4a"', "11장 다운로드 파일명 불일치");
requireText(chapter11, "후속 통화 예제 내려받기", "11장 다운로드 버튼 문구 불일치");
requireText(chapter11, "11장과 12장에서 같은 파일을 사용합니다.", "11·12장 공통 음원 안내 없음");
requireText(chapter11, "약 2분 6초", "11장 녹음 길이 안내 없음");
if ((chapter11.match(/data-download=/g) ?? []).length !== 1) errors.push("11장은 후속 통화 음원 한 건만 제공해야 함");

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
  {
    deployed: resolve(root, "downloads", "예제_녹음.m4a"),
    canonical: resolve(exerciseRoot, "예제_녹음.m4a"),
    expectedHash: "75c3ffa6d9ac2fd994bb20e191f1c693242f707a10beb99b8e80ee71de7a2bbb",
    label: "8장 예제 녹음",
  },
  {
    deployed: resolve(root, "downloads", "후속통화_예제.m4a"),
    canonical: process.env.HANBIT_FOLLOWUP_AUDIO ?? resolve(root, "..", "..", "hanbit-manuscript", "작업본", "11장", "examples", "후속통화_예제.m4a"),
    expectedHash: "d9619b7a30a8c6f49d83fce4ee4057b8f3c492ef7ecdb0b43d46de67ce5510b8",
    label: "11·12장 후속 통화 녹음",
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
const expectedDownloads = ["결과확인표.pdf", "예제_녹음.m4a", "예제_다운로드_폴더.zip", "인생자동화대시보드_PRD.md", "후속통화_예제.m4a"].sort();
if (downloadNames.join("\n") !== expectedDownloads.join("\n")) errors.push(`공개 다운로드 범위 불일치: ${downloadNames.join(", ")}`);

for (const removedChapter of ["7", "9"]) {
  if (existsSync(resolve(root, removedChapter))) errors.push(`제거 대상 장 디렉터리가 남음: ${removedChapter}`);
}

const requestPromptName = "인생자동화대시보드_PRD_요청프롬프트.md";
if (existsSync(resolve(root, "downloads", requestPromptName)) || chapter.includes(requestPromptName)) errors.push("원고용 요청 프롬프트가 사이트 다운로드로 노출됨");

if (vercelConfig.cleanUrls !== true || vercelConfig.trailingSlash !== true) errors.push("Vercel cleanUrls/trailingSlash 계약이 true가 아님");
const redirects = new Map((vercelConfig.redirects ?? []).map((item) => [item.source, item.destination]));
if (
  redirects.size !== 3 ||
  redirects.get("/chapter/05/") !== "/5/" ||
  redirects.get("/chapter/06/") !== "/6/" ||
  redirects.get("/chapter/08/") !== "/8/"
) errors.push("Vercel redirect는 5장, 6장, 8장만 허용됨");

for (const deploymentOnlyPath of [".git", ".github", ".vercel", ".gitattributes", "scripts", "README.md", "ASSET_PROVENANCE.md"]) {
  if (!vercelIgnore.has(deploymentOnlyPath)) errors.push(`Vercel 배포 제외 누락: ${deploymentOnlyPath}`);
}
if (vercelIgnore.has("*.md") || vercelIgnore.has("downloads/*.md")) errors.push("다운로드용 Markdown 파일까지 Vercel 배포에서 제외됨");

const publicHtml = [...pages.values()].join("\n");
for (const forbidden of ["예제_녹음_모음.zip"]) {
  if (publicHtml.includes(forbidden)) errors.push(`제거 대상 다운로드 링크가 남음: ${forbidden}`);
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join("\n"));
  process.exit(1);
}

console.log(`✓ 실습자료 페이지 ${pages.size}개와 완성 목업, 다운로드 5종, 제작 정본 6종, redirect 3개 검증 통과`);
