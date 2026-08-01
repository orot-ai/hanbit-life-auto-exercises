const status = document.querySelector(".download-status");
const downloadLinks = document.querySelectorAll("[data-download]");

let statusTimer;

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
      status.textContent = `${fileName} 다운로드를 시작했습니다. 파일은 다운로드 폴더에 그대로 두세요.`;
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
