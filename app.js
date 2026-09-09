"use strict";

/* =========================================================
   WAR ALERT - PUBLIC APP
   Connected to online FastAPI server
   ========================================================= */

const API_BASE = "https://war-alert.onrender.com";

const alertsContainer = document.getElementById("alerts");
const citySelect = document.getElementById("city");
const refreshButton = document.getElementById("refresh");
const notificationButton = document.getElementById("notifications");
const connectionStatus = document.getElementById("connectionStatus");
const lastUpdate = document.getElementById("lastUpdate");

let currentCity = localStorage.getItem("warAlertCity") || "همه";
let notificationsEnabled =
    localStorage.getItem("warAlertNotifications") === "true";

let previousAlertIds = new Set();

/* =========================================================
   Helpers
   ========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(value) {
    if (!value) return "نامشخص";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("fa-IR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

function setConnection(online, text) {
    if (!connectionStatus) return;

    connectionStatus.textContent =
        text || (online ? "● متصل" : "● قطع");

    connectionStatus.classList.toggle("online", online);
    connectionStatus.classList.toggle("offline", !online);
}

function showLoading() {
    if (!alertsContainer) return;

    alertsContainer.innerHTML = `
        <div class="empty-state">
            <div class="loading-spinner"></div>
            <p>در حال دریافت اطلاعیه‌ها...</p>
        </div>
    `;
}

function showEmpty() {
    if (!alertsContainer) return;

    alertsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">✓</div>
            <h3>اطلاعیه‌ای وجود ندارد</h3>
            <p>در حال حاضر هشدار فعالی برای نمایش وجود ندارد.</p>
        </div>
    `;
}

function showError(message) {
    if (!alertsContainer) return;

    alertsContainer.innerHTML = `
        <div class="empty-state error-state">
            <div class="empty-icon">!</div>
            <h3>خطا در دریافت اطلاعات</h3>
            <p>${escapeHTML(message)}</p>
            <button class="retry-button" onclick="loadAlerts()">
                تلاش دوباره
            </button>
        </div>
    `;
}

/* =========================================================
   Notifications
   ========================================================= */

async function enableNotifications() {
    if (!("Notification" in window)) {
        alert("مرورگر شما از اعلان پشتیبانی نمی‌کند.");
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            notificationsEnabled = true;
            localStorage.setItem("warAlertNotifications", "true");

            updateNotificationButton();

            new Notification("WAR ALERT", {
                body: "اعلان‌ها فعال شدند."
            });
        } else {
            notificationsEnabled = false;
            localStorage.setItem("warAlertNotifications", "false");

            updateNotificationButton();
        }
    } catch (error) {
        console.error(error);
    }
}

function disableNotifications() {
    notificationsEnabled = false;
    localStorage.setItem("warAlertNotifications", "false");
    updateNotificationButton();
}

function updateNotificationButton() {
    if (!notificationButton) return;

    if (notificationsEnabled) {
        notificationButton.textContent = "🔔 اعلان‌ها فعال";
        notificationButton.classList.add("active");
    } else {
        notificationButton.textContent = "🔕 فعال‌کردن اعلان";
        notificationButton.classList.remove("active");
    }
}

function notifyNewAlert(alert) {
    if (!notificationsEnabled) return;

    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") return;

    const title =
        alert.title ||
        "هشدار جدید WAR ALERT";

    const body =
        alert.description ||
        "یک اطلاعیه جدید منتشر شده است.";

    try {
        new Notification(title, {
            body: body,
            tag: `war-alert-${alert.id}`
        });
    } catch (error) {
        console.error("Notification error:", error);
    }
}

/* =========================================================
   Cities
   ========================================================= */

async function loadCities() {
    if (!citySelect) return;

    try {
        const response = await fetch(`${API_BASE}/api/cities`, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("خطا در دریافت شهرها");
        }

        const cities = await response.json();

        citySelect.innerHTML = `
            <option value="همه">همه شهرها</option>
        `;

        if (Array.isArray(cities)) {
            cities.forEach(city => {
                if (!city) return;

                const option = document.createElement("option");
                option.value = city;
                option.textContent = city;

                citySelect.appendChild(option);
            });
        }

        const exists = [...citySelect.options].some(
            option => option.value === currentCity
        );

        if (exists) {
            citySelect.value = currentCity;
        } else {
            currentCity = "همه";
            citySelect.value = "همه";
            localStorage.setItem("warAlertCity", "همه");
        }
    } catch (error) {
        console.error("Cities error:", error);

        citySelect.innerHTML = `
            <option value="همه">همه شهرها</option>
        `;

        citySelect.value = "همه";
    }
}

/* =========================================================
   Load Alerts
   ========================================================= */

async function loadAlerts() {
    showLoading();
    setConnection(false, "● در حال اتصال...");

    try {
        let url;

        if (currentCity && currentCity !== "همه") {
            url =
                `${API_BASE}/api/alerts/city/` +
                encodeURIComponent(currentCity);
        } else {
            url = `${API_BASE}/api/alerts`;
        }

        const response = await fetch(url, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }

        const data = await response.json();

        let alerts = [];

        if (Array.isArray(data)) {
            alerts = data;
        } else if (Array.isArray(data.alerts)) {
            alerts = data.alerts;
        }

        setConnection(true, "● متصل");

        if (lastUpdate) {
            lastUpdate.textContent =
                `آخرین بروزرسانی: ${new Date().toLocaleTimeString("fa-IR")}`;
        }

        renderAlerts(alerts);
    } catch (error) {
        console.error("Load alerts error:", error);

        setConnection(false, "● اتصال ناموفق");

        showError(
            "ارتباط با سرور برقرار نشد. اتصال اینترنت و وضعیت سرور را بررسی کنید."
        );
    }
}

/* =========================================================
   Render Alerts
   ========================================================= */

function renderAlerts(alerts) {
    if (!alertsContainer) return;

    if (!alerts.length) {
        showEmpty();
        previousAlertIds = new Set();
        return;
    }

    alerts.sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || 0).getTime();
        const dateB = new Date(b.created_at || b.date || 0).getTime();

        return dateB - dateA;
    });

    const currentIds = new Set();

    alerts.forEach(alert => {
        if (alert.id !== undefined && alert.id !== null) {
            currentIds.add(String(alert.id));
        }
    });

    if (previousAlertIds.size > 0) {
        alerts.forEach(alert => {
            const id = String(alert.id ?? "");

            if (
                id &&
                !previousAlertIds.has(id)
            ) {
                notifyNewAlert(alert);
            }
        });
    }

    previousAlertIds = currentIds;

    alertsContainer.innerHTML = alerts
        .map(alert => createAlertHTML(alert))
        .join("");
}

function createAlertHTML(alert) {
    const type = String(alert.type || "info").toLowerCase();

    let typeClass = "info";
    let typeText = "اطلاعیه";
    let icon = "ℹ️";

    if (
        type === "danger" ||
        type === "critical" ||
        type === "قرمز"
    ) {
        typeClass = "danger";
        typeText = "هشدار مهم";
        icon = "🚨";
    } else if (
        type === "warning" ||
        type === "warn" ||
        type === "زرد"
    ) {
        typeClass = "warning";
        typeText = "هشدار";
        icon = "⚠️";
    } else if (
        type === "success" ||
        type === "green" ||
        type === "سبز"
    ) {
        typeClass = "success";
        typeText = "اطلاعیه";
        icon = "✅";
    }

    const city =
        alert.city ||
        "همه شهرها";

    const title =
        alert.title ||
        "بدون عنوان";

    const description =
        alert.description ||
        "";

    const source =
        alert.source ||
        "منبع نامشخص";

    const verified =
        alert.verified === true ||
        alert.verified === "true";

    const createdAt =
        alert.created_at ||
        alert.createdAt ||
        alert.date;

    return `
        <article class="alert-card ${typeClass}">
            <div class="alert-header">
                <div class="alert-type ${typeClass}">
                    <span>${icon}</span>
                    <span>${escapeHTML(typeText)}</span>
                </div>

                ${
                    verified
                        ? `
                            <div class="verified">
                                ✓ تأییدشده
                            </div>
                        `
                        : ""
                }
            </div>

            <h2 class="alert-title">
                ${escapeHTML(title)}
            </h2>

            <p class="alert-description">
                ${escapeHTML(description)}
            </p>

            <div class="alert-meta">
                <span>
                    📍 ${escapeHTML(city)}
                </span>

                <span>
                    🕐 ${escapeHTML(formatDate(createdAt))}
                </span>
            </div>

            <div class="alert-source">
                منبع: ${escapeHTML(source)}
            </div>
        </article>
    `;
}

/* =========================================================
   Events
   ========================================================= */

if (citySelect) {
    citySelect.addEventListener("change", () => {
        currentCity = citySelect.value;

        localStorage.setItem(
            "warAlertCity",
            currentCity
        );

        previousAlertIds = new Set();

        loadAlerts();
    });
}

if (refreshButton) {
    refreshButton.addEventListener("click", () => {
        previousAlertIds = new Set();
        loadAlerts();
    });
}

if (notificationButton) {
    notificationButton.addEventListener("click", async () => {
        if (notificationsEnabled) {
            disableNotifications();
        } else {
            await enableNotifications();
        }
    });
}

/* =========================================================
   Automatic Refresh
   ========================================================= */

setInterval(() => {
    loadAlerts();
}, 30000);

/* =========================================================
   Start
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    updateNotificationButton();

    await loadCities();

    await loadAlerts();
});