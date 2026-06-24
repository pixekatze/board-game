const spinButton = document.querySelector(".spin-button");
const btn = document.querySelector(".button");
const btnShadow = document.querySelector(".button-shadow");
const wheel = document.querySelector(".spinner");
const sections = document.querySelectorAll(".section");

let isSpinning = false;
let currentRotation = 0;

spinButton.addEventListener("click", function () {
  if (isSpinning) return;

  btn.classList.remove("btn");
  btn.classList.add("disabled");
  btnShadow.classList.add("disabled");
  btn.disabled = true;
  btn.style.cursor = "not-allowed";
  isSpinning = true;

  const minRotation = 360 * 5;
  const maxRotation = 360 * 10;
  const randomRotation = Math.floor(Math.random() * (maxRotation - minRotation)) + minRotation;

  currentRotation += randomRotation;
  const closestAngle = Math.round(currentRotation / 36) * 36;

  wheel.style.transition = "transform 4s cubic-bezier(0.33, 1, 0.68, 1)";
  wheel.style.transform = `rotate(${closestAngle}deg)`;
  wheel.style.filter = "blur(4px) opacity(0.8)";

  setTimeout(() => {
    let blurValue = 4;
    let opacityValue = 0.8;
    const blurInterval = setInterval(() => {
      blurValue = Math.max(0, blurValue - 0.2);
      opacityValue = Math.min(1, opacityValue + 0.05);
      wheel.style.filter = `blur(${blurValue}px) opacity(${opacityValue})`;
      if (blurValue === 0) clearInterval(blurInterval);
    }, 100);
  }, 2000);

  setTimeout(() => {
    btn.classList.add("btn");
    btn.disabled = false;
    btn.style.cursor = "pointer";
    btn.classList.remove("disabled");
    btnShadow.classList.remove("disabled");
    isSpinning = false;
  }, 5000);

  const normalizedRotation = closestAngle % 360;
  const selectedSectionIndex = normalizedRotation === 0 ? 0 : (360 - normalizedRotation) / 36;
  const selectedValue = sections[selectedSectionIndex].textContent.trim();

  spinButton.setAttribute("data-value", selectedValue);
  currentRotation = closestAngle;
});
