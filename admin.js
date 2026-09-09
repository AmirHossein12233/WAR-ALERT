"use strict";

/*
=========================================================
 WAR-ALERT ADMIN PANEL
 API ONLINE
=========================================================
*/

const API_BASE =
    "https://war-alert.onrender.com";

let ADMIN_TOKEN =
    localStorage.getItem(
        "warAlertAdminToken"
    ) || "";

let allAlerts = [];


/* =====================================================
   ELEMENTS
===================================================== */

const alertForm =
    document.getElementById("alertForm");

const alertId =
    document.getElementById("alertId");

const typeInput =
    document.getElementById("type");

const cityInput =
    document.getElementById("city");

const titleInput =
    document.getElementById("title");

const descriptionInput =
    document.getElementById("description");

const sourceInput =
    document.getElementById("source");

const verifiedInput =
    document.getElementById("verified");

const saveBtn =
    document.getElementById("saveBtn");

const cancelEditBtn =
    document.getElementById(
        "cancelEditBtn"
    );

const formTitle =
    document.getElementById("formTitle");

const formMessage =
    document.getElementById(
        "formMessage"
    );

const alertsList =
    document.getElementById(
        "alertsList"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const totalAlerts =
    document.getElementById(
        "totalAlerts"
    );

const normalAlerts =
    document.getElementById(
        "normalAlerts"
    );

const warningAlerts =
    document.getElementById(
        "warningAlerts"
    );

const dangerAlerts =
    document.getElementById(
        "dangerAlerts"
    );

const serverStatus =
    document.getElementById(
        "serverStatus"
    );

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


/* =====================================================
   TOKEN
===================================================== */

function checkToken() {

    if (!ADMIN_TOKEN) {

        window.location.href =
            "admin-login.html";

        return false;
    }

    return true;
}


function authHeaders(json = false) {

    const headers = {
        "Authorization":
            `Bearer ${ADMIN_TOKEN}`,
        "Accept":
            "application/json"
    };

    if (json) {

        headers[
            "Content-Type"
        ] =
            "application/json; charset=UTF-8";
    }

    return headers;
}


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    text,
    type = ""
) {

    formMessage.textContent =
        text;

    formMessage.className =
        type
            ? `message ${type}`
            : "message";
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =====================================================
   TYPE LABEL
===================================================== */

function typeLabel(type) {

    const labels = {

        info:
            "اطلاعات",

        normal:
            "عادی",

        warning:
            "هشدار",

        danger:
            "اضطراری"
    };

    return (
        labels[type] ||
        type ||
        "نامشخص"
    );
}


/* =====================================================
   LOAD ALERTS
===================================================== */

async function loadAlerts() {

    if (!checkToken()) {
        return;
    }

    try {

        serverStatus.textContent =
            "در حال اتصال...";

        const response =
            await fetch(
                `${API_BASE}/api/alerts`,
                {
                    method: "GET",
                    headers: authHeaders()
                }
            );

        if (!response.ok) {

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logout();

                return;
            }

            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        allAlerts =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(
                        data.alerts
                    )
                        ? data.alerts
                        : []
                );

        serverStatus.textContent =
            "سرور آنلاین است";

        document
            .querySelector(
                ".status-dot"
            )
            ?.classList.add(
                "online"
            );

        renderStats();

        renderAlerts(
            allAlerts
        );

    } catch (error) {

        console.error(error);

        serverStatus.textContent =
            "اتصال به سرور برقرار نشد";

        document
            .querySelector(
                ".status-dot"
            )
            ?.classList.add(
                "offline"
            );

        alertsList.innerHTML = `
            <div class="empty">
                دریافت اطلاعیه‌ها ناموفق بود.
                <br>
                اتصال اینترنت و سرور را بررسی کنید.
            </div>
        `;
    }
}


/* =====================================================
   STATS
===================================================== */

function renderStats() {

    totalAlerts.textContent =
        allAlerts.length;

    normalAlerts.textContent =
        allAlerts.filter(
            alert =>
                alert.type === "normal"
        ).length;

    warningAlerts.textContent =
        allAlerts.filter(
            alert =>
                alert.type === "warning"
        ).length;

    dangerAlerts.textContent =
        allAlerts.filter(
            alert =>
                alert.type === "danger"
        ).length;
}


/* =====================================================
   RENDER
===================================================== */

function renderAlerts(
    alerts
) {

    if (!alerts.length) {

        alertsList.innerHTML = `
            <div class="empty">
                هنوز اطلاعیه‌ای ثبت نشده است.
            </div>
        `;

        return;
    }

    alertsList.innerHTML =
        alerts
            .map(
                alert => {

                    const verified =
                        alert.verified
                            ? "تأیید شده"
                            : "تأیید نشده";

                    return `
                        <article
                            class="alert-card"
                        >

                            <div
                                class="alert-top"
                            >

                                <h3
                                    class="alert-title"
                                >
                                    ${escapeHTML(
                                        alert.title
                                    )}
                                </h3>

                                <span
                                    class="badge ${escapeHTML(
                                        alert.type
                                    )}"
                                >
                                    ${escapeHTML(
                                        typeLabel(
                                            alert.type
                                        )
                                    )}
                                </span>

                            </div>

                            <p
                                class="alert-description"
                            >
                                ${escapeHTML(
                                    alert.description
                                )}
                            </p>

                            <div
                                class="alert-meta"
                            >

                                <span>
                                    شهر:
                                    ${escapeHTML(
                                        alert.city
                                    )}
                                </span>

                                <span>
                                    منبع:
                                    ${escapeHTML(
                                        alert.source ||
                                        "نامشخص"
                                    )}
                                </span>

                                <span>
                                    ${verified}
                                </span>

                                <span>
                                    شناسه:
                                    ${escapeHTML(
                                        alert.id
                                    )}
                                </span>

                            </div>

                            <div
                                class="alert-actions"
                            >

                                <button
                                    class="edit-btn"
                                    onclick="editAlert(${Number(
                                        alert.id
                                    )})"
                                >
                                    ویرایش
                                </button>

                                <button
                                    class="delete-btn"
                                    onclick="deleteAlert(${Number(
                                        alert.id
                                    )})"
                                >
                                    حذف
                                </button>

                            </div>

                        </article>
                    `;
                }
            )
            .join("");
}


/* =====================================================
   ADD / EDIT
===================================================== */

alertForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        if (!checkToken()) {
            return;
        }

        const editing =
            Boolean(
                alertId.value
            );

        const payload = {

            type:
                typeInput.value,

            city:
                cityInput.value.trim(),

            title:
                titleInput.value.trim(),

            description:
                descriptionInput.value.trim(),

            source:
                sourceInput.value.trim(),

            verified:
                verifiedInput.value ===
                "true"
        };

        if (
            !payload.title ||
            !payload.description ||
            !payload.city
        ) {

            showMessage(
                "لطفاً اطلاعات اصلی را کامل کنید.",
                "error"
            );

            return;
        }

        saveBtn.disabled = true;

        saveBtn.textContent =
            editing
                ? "در حال ذخیره..."
                : "در حال ثبت...";

        try {

            const url =
                editing
                    ? `${API_BASE}/api/admin/alerts/${encodeURIComponent(
                        alertId.value
                    )}`
                    : `${API_BASE}/api/admin/alerts`;

            const response =
                await fetch(
                    url,
                    {
                        method:
                            editing
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

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logout();

                return;
            }

            if (!response.ok) {

                const text =
                    await response.text();

                throw new Error(
                    text ||
                    `HTTP ${response.status}`
                );
            }

            showMessage(
                editing
                    ? "اطلاعیه با موفقیت ویرایش شد."
                    : "اطلاعیه با موفقیت ثبت شد.",
                "success"
            );

            resetForm();

            await loadAlerts();

        } catch (error) {

            console.error(error);

            showMessage(
                "ثبت اطلاعات ناموفق بود.",
                "error"
            );

        } finally {

            saveBtn.disabled =
                false;

            saveBtn.textContent =
                editing
                    ? "ذخیره تغییرات"
                    : "ثبت اطلاعیه";
        }
    }
);


/* =====================================================
   EDIT
===================================================== */

window.editAlert =
    function (id) {

        const alert =
            allAlerts.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );

        if (!alert) {
            return;
        }

        alertId.value =
            alert.id;

        typeInput.value =
            alert.type || "info";

        cityInput.value =
            alert.city || "";

        titleInput.value =
            alert.title || "";

        descriptionInput.value =
            alert.description || "";

        sourceInput.value =
            alert.source || "";

        verifiedInput.value =
            alert.verified
                ? "true"
                : "false";

        formTitle.textContent =
            "ویرایش اطلاعیه";

        saveBtn.textContent =
            "ذخیره تغییرات";

        cancelEditBtn.classList.remove(
            "hidden"
        );

        showMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };


/* =====================================================
   DELETE
===================================================== */

window.deleteAlert =
    async function (id) {

        if (!checkToken()) {
            return;
        }

        const confirmed =
            window.confirm(
                "آیا از حذف این اطلاعیه مطمئن هستید؟"
            );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await fetch(
                    `${API_BASE}/api/admin/alerts/${encodeURIComponent(
                        id
                    )}`,
                    {
                        method: "DELETE",
                        headers: authHeaders()
                    }
                );

            if (
                response.status === 401 ||
                response.status === 403
            ) {

                logout();

                return;
            }

            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            await loadAlerts();

        } catch (error) {

            console.error(error);

            alert(
                "حذف اطلاعیه انجام نشد."
            );
        }
    };


/* =====================================================
   RESET FORM
===================================================== */

function resetForm() {

    alertForm.reset();

    alertId.value = "";

    typeInput.value =
        "info";

    verifiedInput.value =
        "false";

    formTitle.textContent =
        "ثبت اطلاعیه جدید";

    saveBtn.textContent =
        "ثبت اطلاعیه";

    cancelEditBtn.classList.add(
        "hidden"
    );

    showMessage("");
}


cancelEditBtn.addEventListener(
    "click",
    resetForm
);


/* =====================================================
   SEARCH
===================================================== */

searchInput.addEventListener(
    "input",
    function () {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();

        if (!query) {

            renderAlerts(
                allAlerts
            );

            return;
        }

        const filtered =
            allAlerts.filter(
                alert => {

                    const text =
                        [
                            alert.title,
                            alert.description,
                            alert.city,
                            alert.source,
                            typeLabel(
                                alert.type
                            )
                        ]
                            .join(" ")
                            .toLowerCase();

                    return text.includes(
                        query
                    );
                }
            );

        renderAlerts(
            filtered
        );
    }
);


/* =====================================================
   REFRESH
===================================================== */

refreshBtn.addEventListener(
    "click",
    loadAlerts
);


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    localStorage.removeItem(
        "warAlertAdminToken"
    );

    ADMIN_TOKEN = "";

    window.location.href =
        "admin-login.html";
}

logoutBtn.addEventListener(
    "click",
    logout
);


/* =====================================================
   START
===================================================== */

if (checkToken()) {

    loadAlerts();

}