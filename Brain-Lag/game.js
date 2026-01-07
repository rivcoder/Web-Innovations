document.addEventListener("DOMContentLoaded", () => {

    /* ==========================
       QUESTIONS
    ========================= */
    const questions = [
        "1. Are you human… or just trying?",
        "2. Are you sure you know what you’re doing?",
        "3. Do you think you’re smart enough to survive this?",
        "4. Are you legally allowed to make decisions like this?",
        "5. Do you actually pay attention… or just click like a fool?",
        "6. Are you capable of making a smart choice… not likely.",
        "7. Will you learn anything from this…? [definitely not. haha.]",
        "8. Do you think this question matters?",
        "9. Your effort here is appreciated… by no one. wanna cry?",
        "10. Final question: Do you think you’ll pass…? [hahaha, no chance.]"
    ];

    /* ==========================
       INSULT POOLS (NO REPEAT)
    ========================= */
    const insults = {
        yes: [
            "You clicked yes like the game cares.",
            "Confidence detected. Intelligence not found.",
            "Ah yes. Blind confidence.",
            "That was brave. Stupid, but brave.",
            "Overconfidence unlocked. Progress not found.",
            "Optimism noted. Ignored.",
            "You trusted yourself. That was the mistake."
        ],
        no: [
            "At least you're honest about it.",
            "Self-awareness arrived too late.",
            "Different button. Same disappointment.",
            "You chose no like it mattered.",
            "You picked no. We noticed. We moved on.",
            "Interesting. Still counts as failure.",
            "You hesitated. The game didn’t."
        ]
    };

    /* ==========================
       BAR MESSAGES
    ========================= */
    const barMessages = {
        up: [
            "False hope detected.",
            "Rising confidence… misguided as always.",
            "Climbing the ladder of delusion."
        ],
        down: [
            "Got scared of that progress bar? Noob.",
            "Confidence leak detected.",
            "That drop felt personal, didn’t it?",
        ]
    };

    /* ==========================
       STATE
    ========================= */
    let currentQuestion = 0;
    let fakeProgress = Math.floor(Math.random() * 40) + 30;

    /* ==========================
       ELEMENTS
    ========================= */
    const qEl = document.getElementById("question");
    const rEl = document.getElementById("response");
    const pEl = document.getElementById("progress");
    const choiceBox = document.getElementById("choices");
    const yesBtn = document.getElementById("yesBtn");
    const noBtn = document.getElementById("noBtn");

    /* ==========================
       PROGRESS BAR (VERTICAL)
    ========================= */
    const barContainer = document.createElement("div");
    barContainer.className = "progress-container";
    barContainer.style.position = "fixed";
    barContainer.style.left = 70%";
    barContainer.style.top = "20%";
    barContainer.style.transform = "translateX(-50%)";
    barContainer.style.width = "20px";
    barContainer.style.height = "60%";
    barContainer.style.background = "#222";
    barContainer.style.borderRadius = "10px";
    barContainer.style.overflow = "hidden";

    const bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.style.width = "100%";
    bar.style.height = fakeProgress + "%";
    bar.style.background = "#4caf50";
    bar.style.transition = "height 0.5s ease";

    barContainer.appendChild(bar);
    document.body.appendChild(barContainer);

    /* ==========================
       HELPERS
    ========================= */
    function getUniqueInsult(choice) {
        if (insults[choice].length === 0) return "...";
        const i = Math.floor(Math.random() * insults[choice].length);
        return insults[choice].splice(i, 1)[0];
    }

    function messWithProgress() {
        const before = fakeProgress;
        const swing = Math.floor(Math.random() * 30) - 15;
        fakeProgress += swing;
        fakeProgress = Math.max(5, Math.min(100, fakeProgress));
        bar.style.height = fakeProgress + "%";

        const delta = fakeProgress - before;
        if (Math.abs(delta) >= 6) {
            const type = delta > 0 ? "up" : "down";
            const msg = barMessages[type][
                Math.floor(Math.random() * barMessages[type].length)
            ];
            rEl.innerText = msg;
        }
    }

    /* ==========================
       FLOW
    ========================== */
    function loadQuestion() {
        qEl.innerText = questions[currentQuestion];
        rEl.innerText = "";
        pEl.innerText = `Progress: ${currentQuestion + 1}/${questions.length}`;
        // re-enable buttons
        yesBtn.disabled = false;
        noBtn.disabled = false;
    }

    function answer(choice) {
        // disable buttons immediately to prevent multiple clicks
        yesBtn.disabled = true;
        noBtn.disabled = true;

        rEl.innerText = getUniqueInsult(choice);
        messWithProgress();

        setTimeout(() => {
            currentQuestion++;
            if (currentQuestion < questions.length) {
                loadQuestion();
            } else {
                qEl.innerText = "Test complete. Hope you enjoyed wasting time.";
                rEl.innerText = "You thought you’d pass… lol, no.. HAHAHAHA";
                pEl.innerText = "";
                choiceBox.remove();

                fakeProgress = Math.min(fakeProgress, 99);
                bar.style.height = fakeProgress + "%";
                bar.style.background = "#ff0000"; // final red bar
            }
        }, 3000);
    }

    /* ==========================
       BACKGROUND DECAY (SUBTLE)
    ========================== */
    setInterval(() => {
        if (Math.random() < 0.25 && fakeProgress > 10) {
            fakeProgress -= Math.floor(Math.random() * 4) + 1;
            bar.style.height = fakeProgress + "%";
        }
    }, 3000);

    /* ==========================
       EVENT LISTENERS
    ========================== */
    yesBtn.addEventListener("click", () => answer("yes"));
    noBtn.addEventListener("click", () => answer("no"));

    /* ==========================
       START
    ========================== */
    qEl.innerText = "Initializing assessment...";
    setTimeout(loadQuestion, 1500);

});


