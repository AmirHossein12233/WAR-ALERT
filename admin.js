"use strict";

/* =========================================================
   WAR ALERT - ADMIN PANEL
   Online API + Automatic Alert Type Detection
   ========================================================= */

const API_BASE = "https://war-alert.onrender.com";

let ADMIN_TOKEN =
    localStorage.getItem("warAlertAdminToken") || "";

let alerts = [];
let editingId = null;

/* =========================================================
   DOM
   ========================================================= */

const alertForm = document.getElementById("alertForm");
const alertsList = document.getElementById("alertsList");
const searchInput = document.getElementById("searchInput");

const serverStatus = document.getElementById("serverStatus");

const totalAlerts = document.getElementById("totalAlerts");
const dangerAlerts = document.getElementById("dangerAlerts");
const warningAlerts = document.getElementById("warningAlerts");
const verifiedAlerts = document.getElementById("verifiedAlerts");

const logoutButton = document.getElementById("logoutButton");
const cancelButton = document.getElementById("cancelButton");

const alertIdInput = document.getElementById("alertId");
const typeInput = document.getElementById("type");
const cityInput = document.getElementById("city");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const sourceInput = document.getElementById("source");
const verifiedInput = document.getElementById("verified");

/* =========================================================
   Authentication
   ========================================================= */

function checkLogin() {
    if (!ADMIN_TOKEN) {
        window.location.href = "admin-login.html";
        return false;
    }

    return true;
}

function authHeaders(json = false) {
    const headers = {
        Authorization: `Bearer ${ADMIN_TOKEN}`
    };

    if (json) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}

/* =========================================================
   Server Status
   ========================================================= */

function setServerStatus(online, text) {
    if (!serverStatus) return;

    serverStatus.textContent =
        text ||
        (online
            ? "● سرور آنلاین"
            : "● سرور آفلاین");

    serverStatus.classList.toggle(
        "online",
        online
    );

    serverStatus.classList.toggle(
        "offline",
        !online
    );
}

/* =========================================================
   API Request
   ========================================================= */

async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);

    if (
        response.status === 401 ||
        response.status === 403
    ) {
        localStorage.removeItem(
            "warAlertAdminToken"
        );

        ADMIN_TOKEN = "";

        window.location.href =
            "admin-login.html";

        throw new Error("Unauthorized");
    }

    return response;
}

/* =========================================================
   Automatic Alert Type Detection
   ========================================================= */

function autoDetectAlertType() {
    const title =
        titleInput?.value || "";

    const description =
        descriptionInput?.value || "";

    const text = `${title} ${description}`
        .toLowerCase()
        .trim();

    if (!text) {
        if (typeInput) {
            typeInput.value = "info";
        }

        updateDetectedType();
        return;
    }

    /*
     * کلمات مربوط به وضعیت بسیار مهم
     */
    const dangerWords = [
        "فوری",
        "اضطراری",
        "خطر فوری",
        "خطر جدی",
        "خطر بسیار جدی",
        "تهدید فوری",
        "تخلیه فوری",
        "وضعیت قرمز",
        "بحران",
        "وضعیت اضطراری",
        "critical",
        "danger",
        "emergency"
    ];

    /*
     * کلمات مربوط به هشدار معمولی
     */
    const warningWords = [
        "هشدار",
        "احتیاط",
        "احتمال",
        "خطر",
        "مراقب",
        "توجه",
        "وضعیت زرد",
        "اخطار",
        "warning",
        "alert"
    ];

    const hasDanger =
        dangerWords.some(word =>
            text.includes(word)
        );

    const hasWarning =
        warningWords.some(word =>
            text.includes(word)
        );

    /*
     * اولویت با danger است.
     */
    if (hasDanger) {
        typeInput.value = "danger";
    } else if (hasWarning) {
        typeInput.value = "warning";
    } else {
        typeInput.value = "info";
    }

    updateDetectedType();
}

/* =========================================================
   Show Detected Type
   ========================================================= */

function updateDetectedType() {
    if (!typeInput) return;

    let box =
        document.getElementById(
            "detectedType"
        );

    if (!box) {
        box = document.createElement("div");

        box.id = "detectedType";

        box.className =
            "detected-type";

        typeInput.parentElement?.appendChild(box);
    }

    const type =
        typeInput.value;

    if (type === "danger") {
        box.textContent =
            "🚨 نوع تشخیص داده‌شده: هشدار مهم";
        box.dataset.type = "danger";
    } else if (type === "warning") {
        box.textContent =
            "⚠️ نوع تشخیص داده‌شده: هشدار";
        box.dataset.type = "warning";
    } else {
        box.textContent =
            "ℹ️ نوع تشخیص داده‌شده: اطلاعیه عادی";
        box.dataset.type = "info";
    }
}

/* =========================================================
   Load Alerts
   ========================================================= */

async function loadAlerts() {
    if (!checkLogin()) return;

    try {
        setServerStatus(
            false,
            "● در حال اتصال..."
        );

        const response =
            await apiRequest(
                `${API_BASE}/api/alerts`,
                {
                    method: "GET",
                    headers: authHeaders(),
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        alerts =
            Array.isArray(data)
                ? data
                : Array.isArray(data.alerts)
                    ? data.alerts
                    : [];

        setServerStatus(
            true,
            "● سرور آنلاین"
        );

        renderStats();
        renderAlerts();
    } catch (error) {
        console.error(
            "Load alerts error:",
            error
        );

        if (
            error.message !==
            "Unauthorized"
        ) {
            setServerStatus(
                false,
                "● خطا در اتصال"
            );

            if (alertsList) {
                alertsList.innerHTML = `
                    <div class="empty-state">
                        دریافت اطلاعیه‌ها ناموفق بود.
                    </div>
                `;
            }
        }
    }
}

/* =========================================================
   Statistics
   ========================================================= */

function renderStats() {
    if (totalAlerts) {
        totalAlerts.textContent =
            alerts.length;
    }

    if (dangerAlerts) {
        dangerAlerts.textContent =
            alerts.filter(alert => {
                const type =
                    String(
                        alert.type || ""
                    ).toLowerCase();

                return (
                    type === "danger" ||
                    type === "critical" ||
                    type === "قرمز"
                );
            }).length;
    }

    if (warningAlerts) {
        warningAlerts.textContent =
            alerts.filter(alert => {
                const type =
                    String(
                        alert.type || ""
                    ).toLowerCase();

                return (
                    type === "warning" ||
                    type === "warn" ||
                    type === "زرد"
                );
            }).length;
    }

    if (verifiedAlerts) {
        verifiedAlerts.textContent =
            alerts.filter(alert =>
                alert.verified === true ||
                alert.verified === "true"
            ).length;
    }
}

/* =========================================================
   Render Alerts
   ========================================================= */

function renderAlerts() {
    if (!alertsList) return;

    const search =
        searchInput?.value
            .trim()
            .toLowerCase() || "";

    const filtered =
        alerts.filter(alert => {
            const text = [
                alert.title,
                alert.description,
                alert.city,
                alert.source,
                alert.type
            ]
                .join(" ")
                .toLowerCase();

            return text.includes(search);
        });

    if (!filtered.length) {
        alertsList.innerHTML = `
            <div class="empty-state">
                اطلاعیه‌ای پیدا نشد.
            </div>
        `;

        return;
    }

    filtered.sort((a, b) => {
        const dateA =
            new Date(
                a.created_at || 0
            ).getTime();

        const dateB =
            new Date(
                b.created_at || 0
            ).getTime();

        return dateB - dateA;
    });

    alertsList.innerHTML =
        filtered
            .map(createAlertItem)
            .join("");
}

/* =========================================================
   Create Alert HTML
   ========================================================= */

function createAlertItem(alert) {
    const type =
        String(
            alert.type || "info"
        ).toLowerCase();

    let typeText =
        "اطلاعیه";

    if (
        type === "danger" ||
        type === "critical" ||
        type === "قرمز"
    ) {
        typeText =
            "هشدار مهم";
    } else if (
        type === "warning" ||
        type === "warn" ||
        type === "زرد"
    ) {
        typeText =
            "هشدار";
    }

    const verified =
        alert.verified === true ||
        alert.verified === "true";

    return `
        <div class="admin-alert-item">

            <div class="admin-alert-main">

                <div class="admin-alert-top">

                    <span class="badge ${escapeHTML(type)}">
                        ${escapeHTML(typeText)}
                    </span>

                    ${
                        verified
                            ? `
                                <span class="verified-badge">
                                    ✓ تأییدشده
                                </span>
                            `
                            : ""
                    }

                </div>

                <h3>
                    ${escapeHTML(
                        alert.title ||
                        "بدون عنوان"
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        alert.description ||
                        ""
                    )}
                </p>

                <div class="admin-alert-meta">

                    <span>
                        📍
                        ${escapeHTML(
                            alert.city ||
                            "همه شهرها"
                        )}
                    </span>

                    <span>
                        🕐
                        ${escapeHTML(
                            formatDate(
                                alert.created_at
                            )
                        )}
                    </span>

                    <span>
                        منبع:
                        ${escapeHTML(
                            alert.source ||
                            "نامشخص"
                        )}
                    </span>

                </div>

            </div>

            <div class="admin-alert-actions">

                <button
                    type="button"
                    onclick="editAlert(${Number(alert.id)})"
                >
                    ویرایش
                </button>

                <button
                    type="button"
                    class="danger-button"
                    onclick="deleteAlert(${Number(alert.id)})"
                >
                    حذف
                </button>

            </div>

        </div>
    `;
}

/* =========================================================
   Save Alert
   ========================================================= */

async function saveAlert(event) {
    event.preventDefault();

    if (!checkLogin()) return;

    /*
     * قبل از ذخیره، دوباره نوع را تشخیص می‌دهیم.
     */
    autoDetectAlertType();

    const payload = {
        type:
            typeInput?.value ||
            "info",

        city:
            cityInput?.value.trim() ||
            "همه",

        title:
            titleInput?.value.trim() ||
            "",

        description:
            descriptionInput?.value.trim() ||
            "",

        source:
            sourceInput?.value.trim() ||
            "WAR ALERT",

        verified:
            Boolean(
                verifiedInput?.checked
            )
    };

    if (!payload.title) {
        alert(
            "عنوان هشدار را وارد کنید."
        );
        return;
    }

    if (!payload.description) {
        alert(
            "متن هشدار را وارد کنید."
        );
        return;
    }

    try {
        const isEdit =
            editingId !== null;

        const url =
            isEdit
                ? `${API_BASE}/api/admin/alerts/${editingId}`
                : `${API_BASE}/api/admin/alerts`;

        const response =
            await apiRequest(
                url,
                {
                    method:
                        isEdit
                            ? "PUT"
                            : "POST",

                    headers:
                        authHeaders(true),

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        if (!response.ok) {
            const text =
                await response.text();

            throw new Error(
                text ||
                `HTTP ${response.status}`
            );
        }

        if (alertForm) {
            alertForm.reset();
        }

        editingId = null;

        if (alertIdInput) {
            alertIdInput.value = "";
        }

        if (cancelButton) {
            cancelButton.style.display =
                "none";
        }

        updateDetectedType();

        await loadAlerts();

        alert(
            isEdit
                ? "هشدار با موفقیت ویرایش شد."
                : "هشدار با موفقیت منتشر شد."
        );
    } catch (error) {
        console.error(error);

        alert(
            "ذخیره هشدار انجام نشد.\n" +
            error.message
        );
    }
}

/* =========================================================
   Edit Alert
   ========================================================= */

function editAlert(id) {
    const alertItem =
        alerts.find(
            alert =>
                Number(alert.id) ===
                Number(id)
        );

    if (!alertItem) {
        alert(
            "هشدار پیدا نشد."
        );
        return;
    }

    editingId =
        Number(alertItem.id);

    if (alertIdInput) {
        alertIdInput.value =
            alertItem.id;
    }

    if (typeInput) {
        typeInput.value =
            alertItem.type ||
            "info";
    }

    if (cityInput) {
        cityInput.value =
            alertItem.city ||
            "همه";
    }

    if (titleInput) {
        titleInput.value =
            alertItem.title ||
            "";
    }

    if (descriptionInput) {
        descriptionInput.value =
            alertItem.description ||
            "";
    }

    if (sourceInput) {
        sourceInput.value =
            alertItem.source ||
            "";
    }

    if (verifiedInput) {
        verifiedInput.checked =
            alertItem.verified === true ||
            alertItem.verified === "true";
    }

    updateDetectedType();

    if (cancelButton) {
        cancelButton.style.display =
            "inline-flex";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   Delete Alert
   ========================================================= */

async function deleteAlert(id) {
    if (!checkLogin()) return;

    const confirmed =
        confirm(
            "آیا از حذف این هشدار مطمئن هستید؟"
        );

    if (!confirmed) return;

    try {
        const response =
            await apiRequest(
                `${API_BASE}/api/admin/alerts/${id}`,
                {
                    method: "DELETE",
                    headers: authHeaders()
                }
            );

        if (!response.ok) {
            const text =
                await response.text();

            throw new Error(
                text ||
                `HTTP ${response.status}`
            );
        }

        await loadAlerts();

        alert(
            "هشدار حذف شد."
        );
    } catch (error) {
        console.error(error);

        alert(
            "حذف هشدار انجام نشد.\n" +
            error.message
        );
    }
}

/* =========================================================
   Cancel Edit
   ========================================================= */

function cancelEdit() {
    editingId = null;

    if (alertForm) {
        alertForm.reset();
    }

    if (alertIdInput) {
        alertIdInput.value = "";
    }

    if (cancelButton) {
        cancelButton.style.display =
            "none";
    }

    updateDetectedType();
}

/* =========================================================
   Logout
   ========================================================= */

function logout() {
    localStorage.removeItem(
        "warAlertAdminToken"
    );

    ADMIN_TOKEN = "";

    window.location.href =
        "admin-login.html";
}

/* =========================================================
   Helpers
   ========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function formatDate(value) {
    if (!value) {
        return "نامشخص";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleString(
        "fa-IR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}

/* =========================================================
   Events
   ========================================================= */

if (alertForm) {
    alertForm.addEventListener(
        "submit",
        saveAlert
    );
}

if (searchInput) {
    searchInput.addEventListener(
        "input",
        renderAlerts
    );
}

if (logoutButton) {
    logoutButton.addEventListener(
        "click",
        logout
    );
}

if (cancelButton) {
    cancelButton.addEventListener(
        "click",
        cancelEdit
    );
}

/*
 * تشخیص خودکار هنگام نوشتن عنوان
 */
if (titleInput) {
    titleInput.addEventListener(
        "input",
        autoDetectAlertType
    );
}

/*
 * تشخیص خودکار هنگام نوشتن توضیحات
 */
if (descriptionInput) {
    descriptionInput.addEventListener(
        "input",
        autoDetectAlertType
    );
}

/*
 * اگر مدیر نوع را دستی تغییر داد،
 * متن تشخیص داده‌شده نیز به‌روزرسانی می‌شود.
 */
if (typeInput) {
    typeInput.addEventListener(
        "change",
        updateDetectedType
    );
}

/* =========================================================
   Global Functions
   ========================================================= */

window.editAlert =
    editAlert;

window.deleteAlert =
    deleteAlert;

window.logout =
    logout;

window.cancelEdit =
    cancelEdit;

window.loadAlerts =
    loadAlerts;

window.autoDetectAlertType =
    autoDetectAlertType;

/* =========================================================
   Start
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        if (!checkLogin()) {
            return;
        }

        updateDetectedType();

        await loadAlerts();
    }
);