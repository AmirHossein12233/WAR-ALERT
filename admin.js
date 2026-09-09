"use strict";

/* =========================================================
   WAR-ALERT ADMIN
   تشخیص کاملاً خودکار نوع اطلاعیه
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

const alertIdInput = document.getElementById("alertId");
const cityInput = document.getElementById("city");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const sourceInput = document.getElementById("source");
const verifiedInput = document.getElementById("verified");

const detectedType = document.getElementById("detectedType");
const detectedTypeIcon = document.getElementById("detectedTypeIcon");
const detectedTypeLabel = document.getElementById("detectedTypeLabel");
const detectedTypeReason = document.getElementById("detectedTypeReason");

const saveBtn = document.getElementById("saveBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");
const formMessage = document.getElementById("formMessage");

const alertsList = document.getElementById("alertsList");
const searchInput = document.getElementById("searchInput");

const refreshBtn = document.getElementById("refreshBtn");
const logoutBtn = document.getElementById("logoutBtn");

const serverStatus = document.getElementById("serverStatus");

const totalAlerts = document.getElementById("totalAlerts");
const normalAlerts = document.getElementById("normalAlerts");
const warningAlerts = document.getElementById("warningAlerts");
const dangerAlerts = document.getElementById("dangerAlerts");


/* =========================================================
   امنیت
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   تشخیص خودکار نوع اطلاعیه
   ========================================================= */

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .replaceAll("ي", "ی")
        .replaceAll("ى", "ی")
        .replaceAll("ك", "ک")
        .replaceAll("ۀ", "ه")
        .replaceAll("ة", "ه")
        .replace(/\u200c/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


const DANGER_WORDS = [

    "فوری",
    "اضطراری",
    "خطر فوری",
    "خطر جدی",
    "خطر بسیار جدی",
    "تهدید فوری",
    "وضعیت قرمز",
    "بحران",
    "وضعیت اضطراری",
    "تخلیه فوری",
    "تخلیه اضطراری",
    "هشدار بسیار شدید",
    "خطر بسیار بالا",
    "وضعیت بحرانی",

    "emergency",
    "critical",
    "danger",
    "evacuate",
    "evacuation",
    "critical alert",
    "emergency alert"
];


const WARNING_WORDS = [

    "هشدار",
    "اخطار",
    "احتیاط",
    "احتمال خطر",
    "احتمال",
    "خطر",
    "مراقب باشید",
    "مراقب",
    "توجه",
    "وضعیت زرد",
    "هشدار امنیتی",
    "هشدار مهم",
    "خطر احتمالی",
    "احتمال وقوع",

    "warning",
    "alert",
    "caution",
    "risk",
    "threat"
];


function findMatchedWord(text, words) {

    for (const word of words) {

        if (text.includes(word)) {
            return word;
        }
    }

    return null;
}


function detectAlertType(title, description) {

    const text = normalizeText(
        `${title || ""} ${description || ""}`
    );

    /*
     * اول اضطراری بررسی می‌شود.
     * اگر متن هم کلمه خطر و هم کلمه هشدار داشته باشد،
     * نوع اضطراری اولویت دارد.
     */

    const dangerMatch = findMatchedWord(
        text,
        DANGER_WORDS
    );

    if (dangerMatch) {

        return {
            type: "danger",
            label: "اضطراری",
            icon: "🚨",
            reason: `به دلیل وجود عبارت «${dangerMatch}»`
        };
    }


    const warningMatch = findMatchedWord(
        text,
        WARNING_WORDS
    );

    if (warningMatch) {

        return {
            type: "warning",
            label: "هشدار",
            icon: "⚠️",
            reason: `به دلیل وجود عبارت «${warningMatch}»`
        };
    }


    return {
        type: "normal",
        label: "عادی",
        icon: "ℹ️",
        reason: "عبارت هشداردهنده یا اضطراری شناسایی نشد"
    };
}


/* =========================================================
   نمایش نوع تشخیص داده شده
   ========================================================= */

function updateDetectedType() {

    const result = detectAlertType(
        titleInput.value,
        descriptionInput.value
    );

    detectedType.className =
        `detected-type ${result.type}`;

    detectedTypeIcon.textContent =
        result.icon;

    detectedTypeLabel.textContent =
        result.label;

    detectedTypeReason.textContent =
        result.reason;

    return result;
}


/* =========================================================
   پیام فرم
   ========================================================= */

function showMessage(message, type = "") {

    formMessage.textContent = message;

    formMessage.className =
        `message ${type}`;

    if (message) {

        setTimeout(() => {

            formMessage.textContent = "";

            formMessage.className =
                "message";

        }, 5000);
    }
}


/* =========================================================
   API
   ========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const headers = {
        ...(options.headers || {})
    };


    if (ADMIN_TOKEN) {

        headers.Authorization =
            `Bearer ${ADMIN_TOKEN}`;
    }


    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {

        headers["Content-Type"] =
            "application/json";
    }


    const response = await fetch(
        `${API_BASE}${url}`,
        {
            ...options,
            headers
        }
    );


    let data = null;

    try {

        data = await response.json();

    } catch {

        data = null;
    }


    if (!response.ok) {

        const message =
            data?.detail ||
            data?.message ||
            `خطای سرور (${response.status})`;

        throw new Error(message);
    }


    return data;
}


/* =========================================================
   بررسی ورود
   ========================================================= */

async function checkLogin() {

    if (!ADMIN_TOKEN) {

        window.location.href =
            "admin-login.html";

        return false;
    }


    try {

        /*
         * درخواست DELETE به یک ID غیرواقعی:
         * اگر 404 باشد یعنی توکن معتبر بوده.
         */

        const response = await fetch(
            `${API_BASE}/api/admin/alerts/999999999`,
            {
                method: "DELETE",
                headers: {
                    Authorization:
                        `Bearer ${ADMIN_TOKEN}`
                }
            }
        );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem(
                "warAlertAdminToken"
            );

            window.location.href =
                "admin-login.html";

            return false;
        }


        return true;

    } catch (error) {

        console.error(
            "Login check error:",
            error
        );

        return true;
    }
}


/* =========================================================
   وضعیت سرور
   ========================================================= */

async function checkServer() {

    serverStatus.textContent =
        "در حال بررسی سرور...";


    try {

        const response =
            await fetch(
                `${API_BASE}/api`,
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {
            throw new Error("Server error");
        }


        const data =
            await response.json();


        if (data.status === "ok") {

            serverStatus.textContent =
                "سرور آنلاین است";

        } else {

            serverStatus.textContent =
                "سرور پاسخ داد";
        }


    } catch (error) {

        console.error(
            "Server status:",
            error
        );

        serverStatus.textContent =
            "اتصال به سرور برقرار نیست";
    }
}


/* =========================================================
   دریافت اطلاعیه‌ها
   ========================================================= */

async function loadAlerts() {

    alertsList.innerHTML = `
        <div class="loading">
            در حال دریافت اطلاعیه‌ها...
        </div>
    `;


    try {

        const data =
            await apiRequest(
                "/api/alerts"
            );


        if (Array.isArray(data)) {

            alerts = data;

        } else if (
            Array.isArray(data.alerts)
        ) {

            alerts = data.alerts;

        } else {

            alerts = [];
        }


        updateStats();

        renderAlerts();

        serverStatus.textContent =
            "سرور آنلاین است";


    } catch (error) {

        console.error(
            "Load alerts:",
            error
        );


        alertsList.innerHTML = `
            <div class="loading">
                دریافت اطلاعیه‌ها انجام نشد.
                <br>
                ${escapeHTML(error.message)}
            </div>
        `;
    }
}


/* =========================================================
   آمار
   ========================================================= */

function updateStats() {

    totalAlerts.textContent =
        alerts.length;


    let normal = 0;
    let warning = 0;
    let danger = 0;


    for (const alert of alerts) {

        const type =
            alert.type || "normal";


        if (type === "danger") {

            danger++;

        } else if (type === "warning") {

            warning++;

        } else {

            normal++;
        }
    }


    normalAlerts.textContent =
        normal;

    warningAlerts.textContent =
        warning;

    dangerAlerts.textContent =
        danger;
}


/* =========================================================
   نمایش اطلاعیه‌ها
   ========================================================= */

function renderAlerts() {

    const query =
        normalizeText(
            searchInput.value
        );


    let filtered = alerts;


    if (query) {

        filtered = alerts.filter(alert => {

            const text = normalizeText(`
                ${alert.title || ""}
                ${alert.description || ""}
                ${alert.city || ""}
                ${alert.source || ""}
            `);

            return text.includes(query);
        });
    }


    if (!filtered.length) {

        alertsList.innerHTML = `
            <div class="loading">
                اطلاعیه‌ای پیدا نشد.
            </div>
        `;

        return;
    }


    alertsList.innerHTML =
        filtered.map(
            createAlertCard
        ).join("");
}


/* =========================================================
   کارت اطلاعیه
   ========================================================= */

function createAlertCard(alert) {

    const type =
        alert.type || "normal";


    let typeLabel = "عادی";
    let icon = "ℹ️";


    if (type === "warning") {

        typeLabel = "هشدار";
        icon = "⚠️";

    } else if (type === "danger") {

        typeLabel = "اضطراری";
        icon = "🚨";
    }


    const verified =
        alert.verified === true ||
        alert.verified === "true";


    const date =
        formatDate(
            alert.created_at ||
            alert.createdAt ||
            alert.date
        );


    return `
        <article
            class="alert-card ${escapeHTML(type)}"
            data-id="${escapeHTML(alert.id)}"
        >

            <div class="alert-card-header">

                <div class="alert-type ${escapeHTML(type)}">
                    ${icon}
                    ${typeLabel}
                </div>

                ${
                    verified
                        ? `<span class="verified">✓ تأیید شده</span>`
                        : `<span class="unverified">تأیید نشده</span>`
                }

            </div>


            <h3>
                ${escapeHTML(alert.title)}
            </h3>


            <p>
                ${escapeHTML(alert.description)}
            </p>


            <div class="alert-meta">

                <span>
                    📍 ${escapeHTML(alert.city || "سراسری")}
                </span>

                ${
                    alert.source
                        ? `<span>منبع: ${escapeHTML(alert.source)}</span>`
                        : ""
                }

                ${
                    date
                        ? `<span>${escapeHTML(date)}</span>`
                        : ""
                }

            </div>


            <div class="alert-actions">

                <button
                    class="edit-btn"
                    onclick="editAlert('${escapeHTML(alert.id)}')"
                >
                    ویرایش
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteAlert('${escapeHTML(alert.id)}')"
                >
                    حذف
                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   تاریخ
   ========================================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }


    try {

        const date =
            new Date(value);


        if (Number.isNaN(date.getTime())) {
            return String(value);
        }


        return date.toLocaleString(
            "fa-IR",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch {

        return String(value);
    }
}


/* =========================================================
   ثبت اطلاعیه
   ========================================================= */

alertForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const title =
            titleInput.value.trim();

        const description =
            descriptionInput.value.trim();

        const city =
            cityInput.value.trim();

        const source =
            sourceInput.value.trim();

        const verified =
            verifiedInput.value === "true";


        if (!title) {

            showMessage(
                "عنوان را وارد کنید.",
                "error"
            );

            titleInput.focus();

            return;
        }


        if (!description) {

            showMessage(
                "متن اطلاعیه را وارد کنید.",
                "error"
            );

            descriptionInput.focus();

            return;
        }


        if (!city) {

            showMessage(
                "شهر را وارد کنید.",
                "error"
            );

            cityInput.focus();

            return;
        }


        /*
         * نوع کاملاً خودکار
         */

        const detected =
            detectAlertType(
                title,
                description
            );


        updateDetectedType();


        const payload = {

            city: city,

            title: title,

            description: description,

            source: source,

            verified: verified,

            /*
             * هیچ انتخاب دستی وجود ندارد.
             * سیستم خودش type را تعیین می‌کند.
             */
            type: detected.type
        };


        saveBtn.disabled = true;

        saveBtn.textContent =
            editingId
                ? "در حال ذخیره..."
                : "در حال ثبت...";


        try {

            let result;


            if (editingId) {

                result =
                    await apiRequest(
                        `/api/admin/alerts/${encodeURIComponent(editingId)}`,
                        {
                            method: "PUT",
                            body: JSON.stringify(payload)
                        }
                    );


                showMessage(
                    `اطلاعیه با نوع «${detected.label}» بروزرسانی شد.`,
                    "success"
                );

            } else {

                result =
                    await apiRequest(
                        "/api/admin/alerts",
                        {
                            method: "POST",
                            body: JSON.stringify(payload)
                        }
                    );


                showMessage(
                    `اطلاعیه با نوع «${detected.label}» ثبت شد.`,
                    "success"
                );
            }


            resetForm();

            await loadAlerts();


        } catch (error) {

            console.error(
                "Save alert:",
                error
            );


            showMessage(
                error.message ||
                "ثبت اطلاعیه انجام نشد.",
                "error"
            );


        } finally {

            saveBtn.disabled = false;

            saveBtn.textContent =
                editingId
                    ? "ذخیره تغییرات"
                    : "ثبت اطلاعیه";
        }
    }
);


/* =========================================================
   تشخیص لحظه‌ای هنگام تایپ
   ========================================================= */

titleInput.addEventListener(
    "input",
    updateDetectedType
);

descriptionInput.addEventListener(
    "input",
    updateDetectedType
);


/* =========================================================
   ویرایش
   ========================================================= */

window.editAlert = function(id) {

    const alert =
        alerts.find(
            item => String(item.id) === String(id)
        );


    if (!alert) {

        showMessage(
            "اطلاعیه پیدا نشد.",
            "error"
        );

        return;
    }


    editingId =
        String(alert.id);


    alertIdInput.value =
        String(alert.id);


    cityInput.value =
        alert.city || "";


    titleInput.value =
        alert.title || "";


    descriptionInput.value =
        alert.description || "";


    sourceInput.value =
        alert.source || "";


    verifiedInput.value =
        (
            alert.verified === true ||
            alert.verified === "true"
        )
            ? "true"
            : "false";


    /*
     * نوع ذخیره‌شده را نادیده می‌گیریم.
     * دوباره از روی متن تشخیص می‌دهیم.
     */

    updateDetectedType();


    formTitle.textContent =
        "ویرایش اطلاعیه";


    saveBtn.textContent =
        "ذخیره تغییرات";


    cancelEditBtn.classList.remove(
        "hidden"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};


/* =========================================================
   حذف
   ========================================================= */

window.deleteAlert = async function(id) {

    const alert =
        alerts.find(
            item => String(item.id) === String(id)
        );


    if (!alert) {
        return;
    }


    const confirmed =
        confirm(
            `اطلاعیه «${alert.title}» حذف شود؟`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/api/admin/alerts/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );


        showMessage(
            "اطلاعیه حذف شد.",
            "success"
        );


        await loadAlerts();


    } catch (error) {

        console.error(
            "Delete alert:",
            error
        );


        showMessage(
            error.message ||
            "حذف اطلاعیه انجام نشد.",
            "error"
        );
    }
};


/* =========================================================
   لغو ویرایش
   ========================================================= */

cancelEditBtn.addEventListener(
    "click",
    function() {

        resetForm();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);


/* =========================================================
   ریست فرم
   ========================================================= */

function resetForm() {

    editingId = null;

    alertIdInput.value = "";

    alertForm.reset();

    verifiedInput.value =
        "false";


    formTitle.textContent =
        "ثبت اطلاعیه جدید";


    saveBtn.textContent =
        "ثبت اطلاعیه";


    cancelEditBtn.classList.add(
        "hidden"
    );


    updateDetectedType();
}


/* =========================================================
   جستجو
   ========================================================= */

searchInput.addEventListener(
    "input",
    renderAlerts
);


/* =========================================================
   بروزرسانی
   ========================================================= */

refreshBtn.addEventListener(
    "click",
    async function() {

        refreshBtn.disabled = true;

        refreshBtn.textContent =
            "در حال بروزرسانی...";


        await checkServer();

        await loadAlerts();


        refreshBtn.disabled = false;

        refreshBtn.textContent =
            "بروزرسانی";
    }
);


/* =========================================================
   خروج
   ========================================================= */

logoutBtn.addEventListener(
    "click",
    function() {

        localStorage.removeItem(
            "warAlertAdminToken"
        );

        window.location.href =
            "admin-login.html";
    }
);


/* =========================================================
   شروع
   ========================================================= */

async function init() {

    const loggedIn =
        await checkLogin();


    if (!loggedIn) {
        return;
    }


    updateDetectedType();

    await checkServer();

    await loadAlerts();
}


init();