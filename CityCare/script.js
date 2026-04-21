let CURRENT_ROLE = null;

function setRole(role) {
    CURRENT_ROLE = role;
    document.getElementById("roleDialog").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
    showTab("report");
    loadHistory();
}

function showTab(tab) {
    document.querySelectorAll(".tabContent").forEach(t => t.style.display = "none");
    document.getElementById(tab).style.display = "block";
}

function autoLocation() {
    const cities = ["Indore", "Delhi", "Mumbai", "Bhopal"];
    document.getElementById("location").value =
        cities[Math.floor(Math.random() * cities.length)];
}

function submitReport() {
    if (CURRENT_ROLE !== "Citizen") return;

    fetch("/submit_report", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            issue: document.getElementById("issue").value,
            location: document.getElementById("location").value
        })
    }).then(() => {
        loadHistory();
        document.getElementById("location").value = "";
        document.getElementById("desc").value = "";
    });
}

function loadHistory() {
    fetch("/get_reports")
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("historyList");
            list.innerHTML = "";

            data.forEach((r, index) => {
                let icon = r.status === "Resolved" ? "🟢"
                           : r.status === "In Progress" ? "🔵" : "🟡";

                let li = document.createElement("li");
                li.innerText = `${icon} #${r.id} • ${r.issue} • ${r.location} • ${r.date}`;

                if (CURRENT_ROLE === "Authority") {
                    let btn1 = document.createElement("button");
                    btn1.innerText = "In Progress";
                    btn1.onclick = () => updateStatus(index, "In Progress");

                    let btn2 = document.createElement("button");
                    btn2.innerText = "Resolve";
                    btn2.onclick = () => updateStatus(index, "Resolved");

                    li.appendChild(btn1);
                    li.appendChild(btn2);
                }

                list.appendChild(li);
            });
        });
}

function updateStatus(index, status) {
    if (CURRENT_ROLE !== "Authority") return;

    fetch("/update_status", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ index, status })
    }).then(loadHistory);
}
