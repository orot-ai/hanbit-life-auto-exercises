const status = document.querySelector(".download-status");
const downloadLinks = document.querySelectorAll("[data-download]");
const copyButton = document.querySelector("[data-copy-url]");

const mobileGate = document.createElement("section");
mobileGate.className = "mobile-gate";
mobileGate.setAttribute("role", "status");
mobileGate.setAttribute("aria-labelledby", "mobile-gate-title");
mobileGate.innerHTML = `
  <div class="mobile-gate-mark" aria-hidden="true">
    <svg viewBox="0 0 56 56"><rect x="8" y="11" width="40" height="28" rx="4"/><path d="M20 47h16M28 39v8"/></svg>
  </div>
  <p class="mobile-gate-kicker">인생자동화 실습자료</p>
  <h1 id="mobile-gate-title">PC에서 접속해 주세요</h1>
  <p class="mobile-gate-copy">이 실습은 파일 다운로드와 프로그램 설치가 필요합니다.<br>컴퓨터에서 이 페이지를 다시 열어 주세요.</p>
  <button class="mobile-gate-copy-button" type="button" data-mobile-copy>주소 복사</button>
`;
document.body.append(mobileGate);

const mobileCopyButton = mobileGate.querySelector("[data-mobile-copy]");

mobileCopyButton?.addEventListener("click", async () => {
  const pageUrl = window.location.href;

  try {
    await navigator.clipboard.writeText(pageUrl);
    mobileCopyButton.textContent = "주소를 복사했습니다";
    mobileCopyButton.classList.add("is-copied");
  } catch (error) {
    console.warn("주소를 복사하지 못했습니다.", error);
    mobileCopyButton.textContent = "주소 표시줄에서 복사해 주세요";
  }
});

let statusTimer;
let copyTimer;

downloadLinks.forEach((link) => {
  const label = link.querySelector("[data-button-label]");
  const originalLabel = label?.textContent ?? "다운로드";

  link.addEventListener("click", () => {
    const fileName = link.dataset.download;

    window.clearTimeout(statusTimer);
    link.classList.add("is-started");

    if (label) {
      label.textContent = "다운로드 시작됨";
    }

    if (status && fileName) {
      status.textContent = "다운로드가 시작됐습니다. 파일은 다운로드 폴더에 저장됩니다.";
      status.classList.add("is-visible");
    }

    statusTimer = window.setTimeout(() => {
      link.classList.remove("is-started");

      if (label) {
        label.textContent = originalLabel;
      }

      status?.classList.remove("is-visible");
    }, 4200);
  });
});

copyButton?.addEventListener("click", async () => {
  const label = copyButton.querySelector("[data-copy-label]");
  const pageUrl = `${window.location.origin}/`;

  window.clearTimeout(copyTimer);

  try {
    await navigator.clipboard.writeText(pageUrl);

    if (label) {
      label.textContent = "주소를 복사했습니다";
    }
  } catch (error) {
    console.warn("주소를 복사하지 못했습니다.", error);

    if (label) {
      label.textContent = "주소 표시줄에서 복사할 수 있습니다";
    }
  }

  copyTimer = window.setTimeout(() => {
    if (label) {
      label.textContent = "주소 복사";
    }
  }, 3200);
});
