document.addEventListener("DOMContentLoaded", () => {
    // If we are on the dashboard, load history
    if (document.getElementById("historyList")) {
        loadHistory();
    }

    // Handle Report Form Submission
    const reportForm = document.getElementById("report-form");
    if (reportForm) {
        reportForm.addEventListener("submit", (e) => {
            e.preventDefault();
            submitReport();
        });
    }

    // Handle file input display & preview
    const fileInput = document.getElementById("image");
    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            const fileNameDisplay = document.getElementById("file-name-display");
            const uploadArea = document.getElementById("upload-area");
            
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                fileNameDisplay.textContent = `Selected: ${file.name}`;
                
                // Show Image Preview
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        uploadArea.style.backgroundImage = `url(${event.target.result})`;
                        uploadArea.style.backgroundSize = 'cover';
                        uploadArea.style.backgroundPosition = 'center';
                        uploadArea.querySelector('.upload-text').style.display = 'none';
                    };
                    reader.readAsDataURL(file);
                }
            } else {
                fileNameDisplay.textContent = "";
                uploadArea.style.backgroundImage = 'none';
                uploadArea.querySelector('.upload-text').style.display = 'block';
            }
        });
    }
});

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    
    // Trigger reflow
    void toast.offsetWidth;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll(".tab-content").forEach(t => {
        t.classList.remove("active");
    });
    
    // Deactivate all buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    
    // Show selected tab content
    document.getElementById(tabId).classList.add("active");
    
    // Activate selected button
    const btnId = `btn-${tabId}`;
    const btn = document.getElementById(btnId);
    if(btn) btn.classList.add("active");
}

function autoLocation() {
    const locInput = document.getElementById("location");
    const originalPlaceholder = locInput.placeholder;
    locInput.value = "";
    locInput.placeholder = "Detecting location...";

    if (!navigator.geolocation) {
        showToast("Geolocation is not supported by your browser", "error");
        locInput.placeholder = originalPlaceholder;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            const latInput = document.getElementById("latitude");
            const lonInput = document.getElementById("longitude");
            if (latInput) latInput.value = lat;
            if (lonInput) lonInput.value = lon;
            
            // Reverse Geocoding using Nominatim (OpenStreetMap)
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.display_name) {
                        // Extract a shorter, friendlier address
                        const address = data.address;
                        const road = address.road || address.suburb || "";
                        const city = address.city || address.town || address.village || "";
                        let finalLocation = `${road ? road + ', ' : ''}${city}`;
                        if (!finalLocation || finalLocation.trim() === ',') {
                            finalLocation = data.display_name.split(',').slice(0, 3).join(',');
                        }
                        locInput.value = finalLocation;
                        showToast("Location detected automatically!");
                    } else {
                        showToast("Could not resolve address", "error");
                        locInput.placeholder = originalPlaceholder;
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast("Error fetching address details", "error");
                    locInput.placeholder = originalPlaceholder;
                });
        },
        (error) => {
            console.error(error);
            showToast("Failed to get location. Ensure permissions are granted.", "error");
            locInput.placeholder = originalPlaceholder;
        }
    );
}

function submitReport() {
    if (CURRENT_USER_ROLE !== "Citizen") return;

    const form = document.getElementById("report-form");
    const formData = new FormData(form);

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Submitting...";
    submitBtn.disabled = true;

    fetch("/api/submit_report", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            form.reset();
            document.getElementById("file-name-display").textContent = "";
            
            showToast("Report submitted successfully!");
            
            // Switch to history tab to see the new report
            showTab("history-tab");
            loadHistory();
        } else {
            showToast("Error submitting report.", "error");
        }
    })
    .catch(err => {
        console.error(err);
        showToast("An error occurred.", "error");
    })
    .finally(() => {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    });
}

function getStatusBadge(status) {
    let className = "sent";
    if (status === "In Progress") className = "progress";
    if (status === "Resolved") className = "resolved";
    return `<span class="status-badge ${className}">${status}</span>`;
}

function loadHistory() {
    if (CURRENT_USER_ROLE === "Authority") {
        fetch("/api/get_stats")
            .then(res => res.json())
            .then(data => {
                const elTotal = document.getElementById("stat-total");
                if (elTotal) {
                    elTotal.innerText = data.total || 0;
                    document.getElementById("stat-pending").innerText = data.sent || 0;
                    document.getElementById("stat-progress").innerText = data.in_progress || 0;
                    document.getElementById("stat-resolved").innerText = data.resolved || 0;
                }
            })
            .catch(err => console.error("Error loading stats:", err));
    }

    fetch("/api/get_reports")
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("historyList");
            if (!list) return;
            
            list.innerHTML = "";
            
            if (data.length === 0) {
                list.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No reports found.</td></tr>`;
                return;
            }

            data.forEach((r) => {
                let tr = document.createElement("tr");
                
                let html = `
                    <td>#${r.id}</td>
                    <td>${r.date}</td>
                    <td>
                        <strong>${r.issue}</strong>
                        ${r.upvotes >= 5 ? '<br><span class="priority-badge">🔥 High Priority</span>' : ''}
                    </td>
                    <td>${r.location}</td>
                `;

                if (CURRENT_USER_ROLE === "Authority") {
                    html += `<td>${r.username}</td>`;
                }

                html += `<td>${r.upvotes || 0}</td>`;

                if (CURRENT_USER_ROLE === "Authority") {
                    const statusClass = r.status.toLowerCase().replace(' ', '-');
                    html += `<td>
                        <select class="status-select ${statusClass}" onchange="updateStatus(${r.id}, this.value, this)">
                            <option value="Sent" ${r.status === 'Sent' ? 'selected' : ''}>Sent</option>
                            <option value="In Progress" ${r.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Resolved" ${r.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
                    </td>`;
                } else {
                    html += `<td>${getStatusBadge(r.status)}</td>`;
                }
                
                html += `<td>`;
                if (CURRENT_USER_ROLE === "Citizen") {
                    html += `<button class="btn-upvote" onclick="upvoteReport(${r.id})">👍 Upvote</button> `;
                }
                html += `<button class="btn-comment" onclick="openCommentsModal(${r.id}, '${r.issue}')">💬 Comments</button>`;
                html += `</td>`;

                tr.innerHTML = html;
                list.appendChild(tr);
            });
        })
        .catch(err => console.error("Error loading history:", err));
}

function updateStatus(id, status, element) {
    if (CURRENT_USER_ROLE !== "Authority") return;

    // Instant visual feedback
    if (element) {
        element.className = `status-select ${status.toLowerCase().replace(' ', '-')}`;
    }

    fetch("/api/update_status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast("Status updated successfully!");
        } else {
            showToast("Error updating status.", "error");
            loadHistory(); // Revert on error
        }
    })
    .catch(err => console.error(err));
}

// ===== UPVOTE SYSTEM =====
function upvoteReport(id) {
    fetch("/api/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast("Upvoted successfully!");
            loadHistory();
        } else {
            showToast("Error upvoting.", "error");
        }
    })
    .catch(err => console.error(err));
}

// ===== COMMENTS SYSTEM =====
let currentCommentReportId = null;

function openCommentsModal(reportId, issueTitle) {
    currentCommentReportId = reportId;
    document.getElementById("modalReportTitle").innerText = `Comments: ${issueTitle}`;
    document.getElementById("commentsModal").style.display = "flex";
    loadComments();
}

function closeCommentsModal() {
    document.getElementById("commentsModal").style.display = "none";
    currentCommentReportId = null;
}

function loadComments() {
    if (!currentCommentReportId) return;
    
    fetch(`/api/comments/${currentCommentReportId}`)
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("commentsList");
            list.innerHTML = "";
            if (data.length === 0) {
                list.innerHTML = "<p class='text-secondary'>No comments yet. Be the first!</p>";
                return;
            }
            data.forEach(c => {
                const isAuth = c.role === "Authority";
                list.innerHTML += `
                    <div class="comment-bubble ${isAuth ? 'authority' : ''}">
                        <div class="comment-header">
                            <strong>${c.username} ${isAuth ? '👑' : ''}</strong>
                            <span>${c.timestamp}</span>
                        </div>
                        <div class="comment-text">${c.text}</div>
                    </div>
                `;
            });
            list.scrollTop = list.scrollHeight; // auto-scroll to bottom
        });
}

document.getElementById("postCommentBtn")?.addEventListener("click", () => {
    const input = document.getElementById("newCommentInput");
    const text = input.value.trim();
    if (!text || !currentCommentReportId) return;

    fetch(`/api/comments/${currentCommentReportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            input.value = "";
            loadComments();
        } else {
            showToast("Error posting comment", "error");
        }
    });
});

// ===== LIVE MAP SYSTEM =====
let cityMap = null;
let markers = [];

function initMap() {
    if (cityMap) return; // already initialized
    
    // Center roughly on India, or a default
    cityMap = L.map('cityMap').setView([20.5937, 78.9629], 5);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(cityMap);
    
    loadMapData();
}

function loadMapData() {
    if (!cityMap) return;
    
    fetch("/api/all_reports")
        .then(res => res.json())
        .then(data => {
            // Clear existing
            markers.forEach(m => cityMap.removeLayer(m));
            markers = [];
            
            let bounds = [];
            
            data.forEach(r => {
                if (r.latitude && r.longitude) {
                    const lat = parseFloat(r.latitude);
                    const lon = parseFloat(r.longitude);
                    if (!isNaN(lat) && !isNaN(lon)) {
                        let color = r.status === 'Resolved' ? 'green' : (r.status === 'In Progress' ? 'blue' : 'orange');
                        
                        let marker = L.circleMarker([lat, lon], {
                            radius: 8,
                            fillColor: color,
                            color: "#fff",
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        }).addTo(cityMap);
                        
                        marker.bindPopup(`<b>${r.issue}</b><br>${r.location}<br>Status: ${r.status}`);
                        markers.push(marker);
                        bounds.push([lat, lon]);
                    }
                }
            });
            
            if (bounds.length > 0) {
                cityMap.fitBounds(bounds, { padding: [50, 50] });
            }
        })
        .catch(err => console.error(err));
}

// ===== LEADERBOARD SYSTEM =====
function loadLeaderboard() {
    fetch("/api/leaderboard")
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("leaderboardList");
            if (!list) return;
            list.innerHTML = "";
            
            if (data.length === 0) {
                list.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">No heroes yet!</td></tr>`;
                return;
            }
            
            data.forEach((u, index) => {
                const rank = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : index + 1));
                list.innerHTML += `
                    <tr>
                        <td><strong>${rank}</strong></td>
                        <td>${u.username}</td>
                        <td><strong style="color: var(--navy-glossy);">${u.points} pts</strong></td>
                    </tr>
                `;
            });
        });
}

// Hook into showTab to initialize/refresh data
const originalShowTab = showTab;
showTab = function(tabId) {
    originalShowTab(tabId);
    if (tabId === 'map-tab') {
        setTimeout(() => {
            initMap();
            if (cityMap) cityMap.invalidateSize(); // fix Leaflet container sizing bug
            loadMapData();
        }, 100);
    } else if (tabId === 'leaderboard-tab') {
        loadLeaderboard();
    }
};