const http = require("http");

const PORT = 3000;

const html = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#641b0a">
<meta name="description" content="Shree Shivay Namastubhyam - Bhagwan Shiv ki bhakti aur mantra jaap.">
<title>श्री शिवाय नमस्तुभ्यं 🔱</title>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --saffron: #ff7417;
  --gold: #ffd875;
  --deep: #270b08;
  --cream: #fff0cc;
}

body {
  min-height: 100vh;
  color: var(--cream);
  font-family: "Noto Sans Devanagari", "Mangal", sans-serif;
  background:
    radial-gradient(ellipse at 50% 20%, #87310e 0%, transparent 48%),
    linear-gradient(145deg, #190604, #54180b 55%, #210804);
  overflow-x: hidden;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.13;
  background-image: radial-gradient(#ffd875 1px, transparent 1px);
  background-size: 32px 32px;
}

nav {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 20px 7%;
  border-bottom: 1px solid #ffcc6440;
}

.brand {
  color: var(--gold);
  font-size: 18px;
  font-weight: bold;
}

nav a {
  color: var(--cream);
  text-decoration: none;
  font-size: 14px;
}

.hero {
  position: relative;
  width: min(900px, 92%);
  margin: auto;
  padding: 65px 0 35px;
  text-align: center;
}

.om {
  color: var(--gold);
  font-size: 35px;
  margin-bottom: 12px;
  text-shadow: 0 0 25px #ffad28;
}

.trishul {
  font-size: 75px;
  margin: 10px 0 18px;
  filter: drop-shadow(0 0 18px #ff9e35);
  animation: glow 3s ease-in-out infinite;
}

h1 {
  color: var(--gold);
  font-size: clamp(32px, 7vw, 58px);
  line-height: 1.5;
  text-shadow: 0 0 25px #ff9e3540;
}

.subtitle {
  margin-top: 12px;
  font-size: 17px;
  color: #ffe5b2;
  line-height: 1.9;
}

.divider {
  width: 140px;
  height: 2px;
  margin: 27px auto;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

.mantra-card {
  max-width: 590px;
  margin: 30px auto;
  padding: 28px 18px;
  border: 1px solid #ffd87575;
  border-radius: 22px;
  background: linear-gradient(135deg, #ffffff0b, #ffb32a10);
  box-shadow: 0 0 45px #ff741715, inset 0 0 25px #ffd87508;
}

.mantra-card h2 {
  color: var(--gold);
  font-size: clamp(23px, 5vw, 35px);
  line-height: 1.8;
}

.mantra-card p {
  color: #ffe4bd;
  margin-top: 10px;
  line-height: 1.8;
}

.counter {
  margin: 24px 0 8px;
  font-size: 42px;
  font-weight: bold;
  color: var(--gold);
  font-variant-numeric: tabular-nums;
}

.counter-label {
  font-size: 13px;
  color: #f6cda1;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 22px;
}

button {
  border: 0;
  border-radius: 999px;
  padding: 13px 23px;
  cursor: pointer;
  font: inherit;
  font-weight: bold;
  transition: transform .2s, box-shadow .2s;
}

button:hover {
  transform: translateY(-2px);
}

.primary {
  color: #401307;
  background: linear-gradient(135deg, #ffe9a2, #ffad35);
  box-shadow: 0 4px 22px #ffad3540;
}

.secondary {
  color: var(--cream);
  border: 1px solid #ffd87570;
  background: #ffffff0a;
}

section.info {
  position: relative;
  width: min(850px, 90%);
  margin: 20px auto 55px;
  text-align: center;
}

.info h2 {
  color: var(--gold);
  font-size: 25px;
  margin-bottom: 16px;
}

.info p {
  color: #ffe6c6;
  line-height: 2;
}

.quote {
  color: var(--gold);
  font-size: 20px;
  margin: 18px 0;
  line-height: 1.9;
}

footer {
  position: relative;
  text-align: center;
  padding: 24px 12px;
  color: #f6cda1;
  font-size: 13px;
  border-top: 1px solid #ffcc6430;
  line-height: 2;
}

@keyframes glow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

@media (max-width: 500px) {
  nav { padding: 16px 5%; }
  .brand { font-size: 15px; }
  .hero { padding-top: 45px; }
  .trishul { font-size: 65px; }
  .mantra-card { padding: 22px 13px; }
}
</style>
</head>

<body>
<nav>
  <div class="brand">🔱 महादेव</div>
  <a href="#jaap">मंत्र जाप</a>
</nav>

<main>
  <section class="hero">
    <div class="om">॥ ॐ ॥</div>
    <div class="trishul" aria-label="त्रिशूल">🔱</div>

    <h1>श्री शिवाय नमस्तुभ्यं</h1>
    <p class="subtitle">
      हर हर महादेव 🙏<br>
      भोलेनाथ की कृपा आप सभी पर बनी रहे।
    </p>

    <div class="divider"></div>

    <div class="mantra-card" id="jaap">
      <h2>ॐ नमः शिवाय</h2>
      <p>श्रद्धा और भक्ति के साथ मंत्र जाप करें।</p>

      <div class="counter" id="count">0</div>
      <div class="counter-label">आपके मंत्र जाप की संख्या</div>

      <div class="actions">
        <button class="primary" id="jaapBtn">
          🙏 मंत्र जाप करें
        </button>
        <button class="secondary" id="resetBtn">
          ↻ फिर से शुरू करें
        </button>
      </div>
    </div>
  </section>

  <section class="info">
    <h2>🌺 शिव भक्ति 🌺</h2>
    <div class="divider"></div>
    <p class="quote">
      तन में शिव, मन में शिव,<br>
      हर धड़कन में शिव का नाम।
    </p>
    <p>
      महादेव हमें शांति, साहस और सद्बुद्धि प्रदान करें।<br>
      अपने मन में प्रेम, करुणा और सकारात्मकता बनाए रखें।
    </p>
    <p class="quote">॥ हर हर महादेव ॥</p>
  </section>
</main>

<footer>
  🔱 श्री शिवाय नमस्तुभ्यं 🔱<br>
  प्रेम • शांति • भक्ति
</footer>

<script>
let count = 0;

const countDisplay = document.getElementById("count");
const jaapButton = document.getElementById("jaapBtn");
const resetButton = document.getElementById("resetBtn");

jaapButton.addEventListener("click", function () {
  count++;
  countDisplay.textContent = count;
});

resetButton.addEventListener("click", function () {
  count = 0;
  countDisplay.textContent = count;
});
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8"
    });
    res.end(html);
    return;
  }

  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  res.end("Page nahi mili.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("🔱 Shree Shivay Namastubhyam website taiyar hai!");
  console.log("Browser mein kholen: http://localhost:" + PORT);
});
