/* =========================================================
   데이트 신청 페이지 - 스크립트
   단계 전환, 도망가는 싫어 버튼, 컨페티, 요약, 답장 이미지 저장(JPG)
   ========================================================= */

/* 사용자의 모든 선택을 담는 객체 */
const answers = {
  date: null,        // "2026-06-15"
  time: null,        // "19:30"
  food: null,        // "🍣 스시"
  accepted: true,    // 좋다고 했으니 항상 true
  createdAt: null,   // 최종 화면 진입 시각 (ISO 문자열)
};

/* ---------- 단계 전환 ---------- */
function goStep(n) {
  document.querySelectorAll(".step").forEach((el) => el.classList.remove("is-active"));
  const target = document.getElementById("step" + n);
  if (target) target.classList.add("is-active");

  // 싫어 버튼은 1단계에서만 보이게 (도망가서 body로 빠진 경우 대비)
  const no = document.getElementById("noBtn");
  if (no) no.style.display = n === 1 ? "" : "none";
}

/* =========================================================
   1단계: 좋아 / 싫어(도망)
   ========================================================= */
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");

yesBtn.addEventListener("click", () => goStep(2));

/* 커서에서 멀어지는 방향으로 싫어 버튼을 옮기기.
   cx, cy 가 주어지면(커서 위치) 반대 방향으로 도망가고,
   없으면 화면 안 랜덤 위치로 이동한다. */
let noPlaceholder = null; // 싫어 버튼이 빠진 자리를 채워 "응 좋아"가 안 밀리게 함

function moveNoButton(cx, cy) {
  // 처음 도망갈 때: fixed 전환 + 카드 밖(body)으로 이동해 화면 전체를 사용
  if (!noBtn.classList.contains("is-running")) {
    // 같은 크기의 빈 자리를 남겨 "응 좋아" 버튼이 그대로 있도록 함
    const w = noBtn.offsetWidth;
    const h = noBtn.offsetHeight;
    noPlaceholder = document.createElement("span");
    noPlaceholder.style.display = "inline-block";
    noPlaceholder.style.width = w + "px";
    noPlaceholder.style.height = h + "px";
    noBtn.parentNode.insertBefore(noPlaceholder, noBtn);

    noBtn.classList.add("is-running");
    document.body.appendChild(noBtn); // 카드의 overflow/backdrop-filter 클리핑에서 탈출
  }
  const pad = 12;
  const bw = noBtn.offsetWidth;
  const bh = noBtn.offsetHeight;
  const maxX = window.innerWidth - bw - pad;
  const maxY = window.innerHeight - bh - pad;

  let x, y;
  if (typeof cx === "number" && typeof cy === "number") {
    // 현재 버튼 중심에서 커서 반대 방향으로 크게 도망 (화면 전체 사용)
    const rect = noBtn.getBoundingClientRect();
    const bcx = rect.left + bw / 2;
    const bcy = rect.top + bh / 2;
    let dx = bcx - cx;
    let dy = bcy - cy;
    const dist = Math.hypot(dx, dy) || 1;
    // 살짝만 비켜서기 — 클릭만 안 될 정도로 미세하게
    const jump = 55 + Math.random() * 35;
    x = bcx + (dx / dist) * jump - bw / 2;
    y = bcy + (dy / dist) * jump - bh / 2;

    // 벽에 몰려 더 못 비키면, 벽을 따라 살짝 옆으로 미끄러지기
    if (x < pad || x > maxX || y < pad || y > maxY) {
      const slide = (Math.random() < 0.5 ? -1 : 1) * (50 + Math.random() * 40);
      // 커서와의 거리가 더 먼 축(가로/세로) 쪽으로 미끄러뜨림
      if (Math.abs(dx) > Math.abs(dy)) {
        y = bcy + slide - bh / 2;
        x = bcx + (dx >= 0 ? 1 : -1) * jump - bw / 2;
      } else {
        x = bcx + slide - bw / 2;
        y = bcy + (dy >= 0 ? 1 : -1) * jump - bh / 2;
      }
    }
  } else {
    x = Math.random() * maxX;
    y = Math.random() * maxY;
  }

  // 화면 밖으로 나가지 않도록 범위 보정
  x = Math.min(Math.max(pad, x), maxX);
  y = Math.min(Math.max(pad, y), maxY);

  noBtn.style.left = x + "px";
  noBtn.style.top = y + "px";
}

/* PC: 커서가 일정 거리 안으로 들어오면 미리 피한다 */
const DODGE_RADIUS = 55; // px — 커서가 바짝 다가왔을 때만 살짝 피함
document.addEventListener("mousemove", (e) => {
  // 1단계가 보일 때만 작동
  if (!document.getElementById("step1").classList.contains("is-active")) return;
  const rect = noBtn.getBoundingClientRect();
  const bcx = rect.left + rect.width / 2;
  const bcy = rect.top + rect.height / 2;
  const dist = Math.hypot(e.clientX - bcx, e.clientY - bcy);
  if (dist < DODGE_RADIUS) {
    moveNoButton(e.clientX, e.clientY);
  }
});

/* 모바일: 터치하려 하면 도망 (클릭 자체도 막기) */
noBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const t = e.touches[0];
  moveNoButton(t.clientX, t.clientY);
}, { passive: false });
/* 혹시라도 클릭되면 무시하고 도망 */
noBtn.addEventListener("click", (e) => {
  e.preventDefault();
  moveNoButton();
});

/* =========================================================
   2단계: 수락 확인 + 컨페티
   ========================================================= */
const reallyYesBtn = document.getElementById("reallyYesBtn");

reallyYesBtn.addEventListener("click", () => goStep(3));

/* 화면 위쪽에서 컨페티 이모지가 쏟아지는 효과 */
function launchConfetti() {
  const emojis = ["🎉", "🎊", "✨", "💖", "💕", "🌸"];
  const count = 70;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.fontSize = 18 + Math.random() * 18 + "px";
    piece.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
    piece.style.animationDelay = Math.random() * 0.6 + "s";
    document.body.appendChild(piece);
    // 애니메이션이 끝나면 정리
    piece.addEventListener("animationend", () => piece.remove());
  }
}

/* =========================================================
   3단계: 날짜 / 시간 선택 + validation
   ========================================================= */
const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");
const dateNextBtn = document.getElementById("dateNextBtn");
const step3Hint = document.getElementById("step3Hint");

dateNextBtn.addEventListener("click", () => {
  if (!dateInput.value && !timeInput.value) {
    step3Hint.textContent = "날짜랑 시간을 골라줘야 만날 수 있어 🥺";
    return;
  }
  if (!dateInput.value) {
    step3Hint.textContent = "앗, 날짜를 안 골랐어! 📆";
    return;
  }
  if (!timeInput.value) {
    step3Hint.textContent = "앗, 시간을 안 골랐어! ⏰";
    return;
  }
  // 통과 → 저장 후 4단계
  step3Hint.textContent = "";
  answers.date = dateInput.value;
  answers.time = timeInput.value;
  goStep(4);
});

/* =========================================================
   4단계: 음식 선택 (클릭 시 바로 5단계)
   ========================================================= */
document.querySelectorAll(".btn--food").forEach((btn) => {
  btn.addEventListener("click", () => {
    answers.food = btn.dataset.food;
    showFinal();
  });
});

/* =========================================================
   5단계: 최종 화면 (요약 + 떠다니는 하트)
   ========================================================= */
const finalTitle = document.getElementById("finalTitle");
const sumDate = document.getElementById("sumDate");
const sumTime = document.getElementById("sumTime");
const sumFood = document.getElementById("sumFood");

/* "2026-06-15" → "2026년 6월 15일" */
function formatKoreanDate(value) {
  if (!value) return "-";
  const [y, m, d] = value.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function showFinal() {
  answers.createdAt = new Date().toISOString();

  // 콘솔에서 저장 구조 확인 가능
  console.log("📦 저장된 답변:", answers);

  // 제목의 n시를 선택한 시간으로 치환 (쉼표 뒤에서 줄바꿈)
  finalTitle.textContent =
    `싫다고 안해줘서 기뻐,\n${answers.time}시에 내가 데리러 갈게 🚶🏻‍♀️`;

  // 요약 카드 채우기 (화면 표시용)
  sumDate.textContent = formatKoreanDate(answers.date);
  sumTime.textContent = answers.time || "-";
  sumFood.textContent = answers.food || "-";

  // 저장 전용 카드도 같은 값으로 채우기
  const capDate = document.getElementById("capDate");
  const capTime = document.getElementById("capTime");
  const capFood = document.getElementById("capFood");
  if (capDate) capDate.textContent = formatKoreanDate(answers.date);
  if (capTime) capTime.textContent = answers.time || "-";
  if (capFood) capFood.textContent = answers.food || "-";

  goStep(5);
  startFloatingHearts();
}

/* 떠다니는 하트 효과 (최종 화면 동안 반복) */
let heartTimer = null;
function startFloatingHearts() {
  const layer = document.getElementById("floatingLayer");
  const hearts = ["💖", "💕", "💗", "🌸", "✨"];
  if (heartTimer) clearInterval(heartTimer);
  heartTimer = setInterval(() => {
    // 5단계가 아니면 멈춤
    if (!document.getElementById("step5").classList.contains("is-active")) {
      clearInterval(heartTimer);
      heartTimer = null;
      return;
    }
    const h = document.createElement("span");
    h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    h.style.left = Math.random() * 100 + "vw";
    h.style.fontSize = 18 + Math.random() * 18 + "px";
    h.style.animationDuration = 4 + Math.random() * 3 + "s";
    layer.appendChild(h);
    h.addEventListener("animationend", () => h.remove());
  }, 450);
}

/* =========================================================
   답장 이미지 저장 (요약 박스를 JPG로) + 다시하기
   ========================================================= */
const saveBtn = document.getElementById("saveBtn");
const saveHint = document.getElementById("saveHint");
const restartBtn = document.getElementById("restartBtn");
const captureStage = document.getElementById("captureStage");

/* 화면 밖 저장 전용 카드(#captureStage)를 JPG 이미지로 내려받는다.
   저장한 이미지를 상대방에게 답장으로 보내면 됨 💌 */
saveBtn.addEventListener("click", () => {
  if (typeof html2canvas !== "function") {
    saveHint.textContent = "이미지 저장 도구를 불러오지 못했어 😢 (인터넷 연결 확인)";
    return;
  }

  saveHint.textContent = "이미지 만드는 중... 🎀";

  html2canvas(captureStage, {
    backgroundColor: "#ffeef4", // 프레임 배경색과 동일 (투명 방지)
    scale: 2,                    // 선명하게 (레티나 대응)
    useCORS: true,
  })
    .then((canvas) => {
      const jpg = canvas.toDataURL("image/jpeg", 0.95);

      const link = document.createElement("a");
      link.download = `데이트약속_${answers.date || "약속"}.jpg`;
      link.href = jpg;
      document.body.appendChild(link);
      link.click();
      link.remove();

      saveHint.textContent = "이미지 저장 완료! 이걸 답장으로 보내줘 💌";
    })
    .catch((err) => {
      console.error("이미지 저장 실패:", err);
      saveHint.textContent = "저장에 실패했어 😢 다시 한 번 눌러줘";
    });
});

/* 처음부터 다시하기: 선택값 초기화 후 1단계로 */
restartBtn.addEventListener("click", () => {
  answers.date = null;
  answers.time = null;
  answers.food = null;
  answers.createdAt = null;

  dateInput.value = "";
  timeInput.value = "";
  step3Hint.textContent = "";
  if (saveHint) saveHint.textContent = "";

  // 도망 버튼 위치 초기화 + 카드 안 원래 자리로 복귀
  noBtn.classList.remove("is-running");
  noBtn.style.left = "";
  noBtn.style.top = "";
  document.getElementById("playground").appendChild(noBtn);
  if (noPlaceholder) {
    noPlaceholder.remove();
    noPlaceholder = null;
  }

  goStep(1);
});

/* =========================================================
   2단계 진입 시 컨페티 발사 연결
   (reallyYes 버튼 클릭이 아니라, 2단계 표시되는 순간 터지게)
   ========================================================= */
yesBtn.addEventListener("click", () => {
  // 1→2 전환 직후 컨페티
  setTimeout(launchConfetti, 150);
});
