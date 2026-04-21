let currentTab = "chat";

function switchTab(tab) {
    document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
    document.getElementById(tab).classList.remove("hidden");
    currentTab = tab;
}

async function sendChat() {
    const input = document.getElementById("chat-input");
    if (!input.value) return;
    appendMessage("You", input.value);
    const prompt = input.value;
    input.value = "";

    const res = await fetch("http://127.0.0.1:8000/api/ai", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({prompt, mode: "chat"})
    });
    const data = await res.json();
    appendMessage("Kyanos", data.response);
}

function appendMessage(sender, text) {
    const win = document.getElementById("chat-window");
    const div = document.createElement("div");
    div.innerHTML = `<b>${sender}:</b> ${text}`;
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
}

async function generateNotes() {
    const topic = document.getElementById("notes-topic").value;
    if (!topic) return;
    const res = await fetch("http://127.0.0.1:8000/api/ai", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({prompt: topic, mode: "notes"})
    });
    const data = await res.json();
    document.getElementById("notes-output").innerText = data.response;
}

async function generateQuiz() {
    const topic = document.getElementById("quiz-topic").value;
    if (!topic) return;
    const res = await fetch("http://127.0.0.1:8000/api/ai", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({prompt: topic, mode: "quiz"})
    });
    const data = await res.json();
    document.getElementById("quiz-output").innerText = data.response;
}

async function generateFlash() {
    const topic = document.getElementById("flash-topic").value;
    if (!topic) return;
    const res = await fetch("http://127.0.0.1:8000/api/ai", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({prompt: topic, mode: "flashcards"})
    });
    const data = await res.json();
    document.getElementById("flash-output").innerText = data.response;
}
