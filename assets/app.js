const status = document.querySelector(".download-status");
const downloadLinks = document.querySelectorAll("[data-download]");
const copyButton = document.querySelector("[data-copy-url]");

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
