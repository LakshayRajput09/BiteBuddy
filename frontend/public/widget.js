(function () {
  "use strict";

  const scriptTag = document.currentScript || document.querySelector("script[data-api]");
  const API_ENDPOINT = (scriptTag && scriptTag.getAttribute("data-api")) || "http://localhost:8000/api/canteen/chat";

  // Prevent multiple injections
  if (document.getElementById("bitebuddy-canteen-widget-root")) return;

  const root = document.createElement("div");
  root.id = "bitebuddy-canteen-widget-root";
  document.body.appendChild(root);

  // Inject Styles
  const style = document.createElement("style");
  style.textContent = `
    #bitebuddy-canteen-widget-root {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .bb-launcher {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d97706, #b45309);
      color: white;
      border: none;
      box-shadow: 0 10px 25px rgba(180, 83, 9, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .bb-launcher:hover {
      transform: scale(1.08);
      box-shadow: 0 14px 30px rgba(180, 83, 9, 0.5);
    }
    .bb-panel {
      display: none;
      width: 380px;
      height: 520px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 100px);
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.18);
      border: 1px solid #e2e8f0;
      overflow: hidden;
      flex-direction: column;
    }
    .bb-panel.open {
      display: flex;
    }
    .bb-header {
      background: linear-gradient(135deg, #d97706, #b45309);
      color: white;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .bb-header h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
    }
    .bb-header p {
      margin: 2px 0 0 0;
      font-size: 11px;
      opacity: 0.9;
    }
    .bb-close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0 4px;
      opacity: 0.8;
    }
    .bb-close-btn:hover {
      opacity: 1;
    }
    .bb-messages {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .bb-msg {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.45;
      word-break: break-word;
    }
    .bb-msg-user {
      align-self: flex-end;
      background: #d97706;
      color: white;
      border-bottom-right-radius: 2px;
    }
    .bb-msg-bot {
      align-self: flex-start;
      background: #ffffff;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 2px;
    }
    .bb-food-card {
      margin-top: 8px;
      padding: 8px 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 12px;
    }
    .bb-food-name {
      font-weight: 700;
      color: #0f172a;
    }
    .bb-food-price {
      color: #b45309;
      font-weight: 700;
      float: right;
    }
    .bb-food-tags {
      display: flex;
      gap: 4px;
      margin-top: 4px;
      flex-wrap: wrap;
    }
    .bb-tag {
      background: #ecfdf5;
      color: #047857;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      border: 1px solid #a7f3d0;
    }
    .bb-chips {
      padding: 8px 12px;
      background: #f1f5f9;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 6px;
      overflow-x: auto;
      white-space: nowrap;
    }
    .bb-chip {
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 4px 10px;
      font-size: 11px;
      color: #334155;
      cursor: pointer;
      flex-shrink: 0;
    }
    .bb-chip:hover {
      background: #fef3c7;
      border-color: #f59e0b;
      color: #92400e;
    }
    .bb-input-bar {
      padding: 10px;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
    }
    .bb-input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
    }
    .bb-input:focus {
      border-color: #d97706;
      box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
    }
    .bb-send-btn {
      background: #d97706;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 0 14px;
      cursor: pointer;
      font-weight: 600;
    }
    .bb-send-btn:hover {
      background: #b45309;
    }
  `;
  document.head.appendChild(style);

  // Widget HTML Structure
  root.innerHTML = `
    <button class="bb-launcher" id="bb-launcher" aria-label="Open Canteen AI">🍽️</button>
    <div class="bb-panel" id="bb-panel">
      <div class="bb-header">
        <div>
          <h4>BiteBuddy Canteen AI</h4>
          <p>● Menu Q&A & Recommendations</p>
        </div>
        <button class="bb-close-btn" id="bb-close">&times;</button>
      </div>
      <div class="bb-messages" id="bb-messages">
        <div class="bb-msg bb-msg-bot">
          👋 Hi! Ask me any question about our canteen menu (prices, ingredients, veg options) or ask for recommendations!
        </div>
      </div>
      <div class="bb-chips">
        <button class="bb-chip" data-query="what's under ₹50 and veg?">Under ₹50 & veg?</button>
        <button class="bb-chip" data-query="is the fried rice spicy?">Is fried rice spicy?</button>
        <button class="bb-chip" data-query="I want something light and not too expensive">Light & cheap recommendation</button>
      </div>
      <div class="bb-input-bar">
        <input type="text" class="bb-input" id="bb-input" placeholder="Ask about menu items..." />
        <button class="bb-send-btn" id="bb-send">Send</button>
      </div>
    </div>
  `;

  const launcher = root.querySelector("#bb-launcher");
  const panel = root.querySelector("#bb-panel");
  const closeBtn = root.querySelector("#bb-close");
  const messagesBox = root.querySelector("#bb-messages");
  const inputField = root.querySelector("#bb-input");
  const sendBtn = root.querySelector("#bb-send");
  const chips = root.querySelectorAll(".bb-chip");

  function toggle(open) {
    if (open) {
      launcher.style.display = "none";
      panel.classList.add("open");
      inputField.focus();
    } else {
      launcher.style.display = "flex";
      panel.classList.remove("open");
    }
  }

  launcher.addEventListener("click", () => toggle(true));
  closeBtn.addEventListener("click", () => toggle(false));

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-query");
      if (q) sendMessage(q);
    });
  });

  sendBtn.addEventListener("click", () => {
    const text = inputField.value.trim();
    if (text) sendMessage(text);
  });

  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const text = inputField.value.trim();
      if (text) sendMessage(text);
    }
  });

  async function sendMessage(text) {
    inputField.value = "";

    // User message
    const userDiv = document.createElement("div");
    userDiv.className = "bb-msg bb-msg-user";
    userDiv.textContent = text;
    messagesBox.appendChild(userDiv);

    // Bot loading
    const botDiv = document.createElement("div");
    botDiv.className = "bb-msg bb-msg-bot";
    botDiv.textContent = "⏳ Checking canteen database...";
    messagesBox.appendChild(botDiv);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      botDiv.innerHTML = (data.reply_text || "Found on menu.").replace(/\n/g, "<br>");

      if (data.matched_items && data.matched_items.length > 0) {
        data.matched_items.forEach((item) => {
          const card = document.createElement("div");
          card.className = "bb-food-card";
          card.innerHTML = `
            <span class="bb-food-name">${item.name}</span>
            <span class="bb-food-price">₹${Math.round(item.price)}</span>
            <div style="color: #64748b; margin-top: 2px;">${item.description}</div>
            <div class="bb-food-tags">
              ${(item.dietary_tags || []).map(t => `<span class="bb-tag">${t}</span>`).join("")}
              ${item.spice_level ? `<span class="bb-tag" style="background:#fff1f2; color:#be123c; border-color:#fecdd3;">🌶️ ${item.spice_level}</span>` : ""}
            </div>
          `;
          botDiv.appendChild(card);
        });
      }
    } catch (e) {
      botDiv.textContent = "⚠️ Could not connect to canteen API at " + API_ENDPOINT;
    }
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
})();

