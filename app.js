"use strict";

/*
==================================================
 WAR ALERT
 app.js
 نسخه 1.1.0
==================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    // ==================================================
    // تنظیمات
    // ==================================================

    const APP_VERSION = "1.1.0";

    const API_BASE = "https://war-alert.onrender.com";

    let currentCity =
        localStorage.getItem("warAlertCity") || "";

    let notificationEnabled =
        localStorage.getItem("warAlertNotifications") === "true";

    let serverAlerts = [];

    let dataUpdatedAt = null;


    // ==================================================
    // عناصر صفحه
    // ==================================================

    const selectedCity =
        document.getElementById("selectedCity");

    const changeCityBtn =
        document.getElementById("changeCityBtn");

    const cityModal =
        document.getElementById("cityModal");

    const closeModal =
        document.getElementById("closeModal");

    const cityButtons =
        document.querySelectorAll(".city-btn");

    const refreshBtn =
        document.getElementById("refreshBtn");

    const notificationBtn =
        document.getElementById("notificationBtn");

    const alertsList =
        document.getElementById("alertsList");

    const statusTitle =
        document.getElementById("statusTitle");

    const statusDescription =
        document.getElementById("statusDescription");

    const statusCard =
        document.querySelector(".status-card");

    const statusIcon =
        document.querySelector(".status-icon");

    const toast =
        document.getElementById("toast");


    // ==================================================
    // Toast
    // ==================================================

    let toastTimer = null;


    function showToast(message) {

        if (!toast) return;

        toast.textContent = message;

        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {

            toast.classList.remove("show");

        }, 2500);

    }


    // ==================================================
    // HTML امن
    // ==================================================

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ==================================================
    // شهر
    // ==================================================

    function updateCityUI() {

        if (!selectedCity) return;

        selectedCity.textContent =
            currentCity || "انتخاب نشده";

    }


    function openCityModal() {

        if (!cityModal) return;

        cityModal.classList.remove("hidden");

        document.body.style.overflow =
            "hidden";

    }


    function closeCityModal() {

        if (!cityModal) return;

        cityModal.classList.add("hidden");

        document.body.style.overflow =
            "";

    }


    async function selectCity(city) {

        if (!city) return;

        currentCity = city;

        localStorage.setItem(
            "warAlertCity",
            currentCity
        );

        updateCityUI();

        closeCityModal();

        renderAlerts();

        updateStatus();

        showToast(
            `منطقه «${city}» انتخاب شد`
        );

    }


    // ==================================================
    // رویدادهای شهر
    // ==================================================

    if (changeCityBtn) {

        changeCityBtn.addEventListener(
            "click",
            openCityModal
        );

    }


    if (closeModal) {

        closeModal.addEventListener(
            "click",
            closeCityModal
        );

    }


    cityButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const city =
                    button.dataset.city;

                selectCity(city);

            }
        );

    });


    if (cityModal) {

        cityModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === cityModal
                ) {

                    closeCityModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeCityModal();

            }

        }
    );


    // ==================================================
    // دریافت اطلاعات از API
    // ==================================================

    async function fetchAlerts() {

        try {

            const url = currentCity
                ? `${API_BASE}/api/alerts/${encodeURIComponent(currentCity)}`
                : `${API_BASE}/api/alerts`;


            const response =
                await fetch(url, {
                    method: "GET",
                    cache: "no-store"
                });


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const data =
                await response.json();


            if (
                !data ||
                !Array.isArray(data.alerts)
            ) {

                throw new Error(
                    "ساختار اطلاعات API نامعتبر است."
                );

            }


            serverAlerts =
                data.alerts;

            dataUpdatedAt =
                data.updatedAt || null;


            renderAlerts();

            updateStatus();

            updateDataTime();


            return true;

        }

        catch (error) {

            console.error(
                "WAR ALERT API ERROR:",
                error
            );


            /*
             * اگر اتصال به سرور قطع باشد،
             * داده‌های قبلی روی صفحه باقی می‌مانند.
             */

            if (
                !serverAlerts ||
                serverAlerts.length === 0
            ) {

                renderOfflineMessage();

            }


            return false;

        }

    }


    // ==================================================
    // نمایش زمان اطلاعات
    // ==================================================

    function updateDataTime() {

        if (!dataUpdatedAt) return;

        console.log(
            "آخرین بروزرسانی داده:",
            dataUpdatedAt
        );

    }


    // ==================================================
    // دریافت اطلاعیه‌های شهر
    // ==================================================

    function getCurrentAlerts() {

        if (!Array.isArray(serverAlerts)) {

            return [];

        }


        if (!currentCity) {

            return serverAlerts;

        }


        return serverAlerts.filter(
            alert =>
                alert.city === "همه" ||
                alert.city === currentCity
        );

    }


    // ==================================================
    // ساخت کارت اطلاعیه
    // ==================================================

    function createAlertCard(alert) {

        const article =
            document.createElement("article");

        article.className =
            "alert-card";


        // نوع اطلاعیه

        let badgeClass = "info";

        let badgeText = "اطلاعیه";


        if (alert.type === "normal") {

            badgeClass =
                "normal-badge";

            badgeText =
                "عادی";

        }

        else if (alert.type === "warning") {

            badgeClass =
                "warning-badge";

            badgeText =
                "هشدار";

        }

        else if (alert.type === "danger") {

            badgeClass =
                "danger-badge";

            badgeText =
                "هشدار فوری";

        }


        // وضعیت تأیید

        const verifiedText =
            alert.verified === true
                ? "✓ تأییدشده"
                : "آزمایشی";


        article.innerHTML = `

            <div class="alert-top">

                <span class="alert-badge ${badgeClass}">
                    ${escapeHTML(badgeText)}
                </span>

                <span class="alert-time">
                    ${escapeHTML(
                        alert.time || ""
                    )}
                </span>

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


            <div class="alert-source">

                منبع:
                ${escapeHTML(
                    alert.source ||
                    "نامشخص"
                )}

                <span>
                    ·
                    ${escapeHTML(
                        verifiedText
                    )}
                </span>

            </div>

        `;


        return article;

    }


    // ==================================================
    // نمایش اطلاعیه‌ها
    // ==================================================

    function renderAlerts() {

        if (!alertsList) return;


        alertsList.innerHTML = "";


        const alerts =
            getCurrentAlerts();


        // هیچ اطلاعیه‌ای وجود ندارد

        if (
            !alerts ||
            alerts.length === 0
        ) {

            const empty =
                document.createElement("div");


            empty.className =
                "alert-card";


            empty.innerHTML = `

                <div class="alert-top">

                    <span class="alert-badge normal-badge">
                        عادی
                    </span>

                    <span class="alert-time">
                        اکنون
                    </span>

                </div>


                <h3>
                    اطلاعیه‌ای وجود ندارد
                </h3>


                <p>
                    در حال حاضر اطلاعیه‌ای برای
                    منطقه انتخاب‌شده ثبت نشده است.
                </p>

            `;


            alertsList.appendChild(empty);

            return;

        }


        // نمایش اطلاعیه‌ها

        alerts.forEach(alert => {

            const card =
                createAlertCard(alert);

            alertsList.appendChild(card);

        });

    }


    // ==================================================
    // حالت بدون اتصال
    // ==================================================

    function renderOfflineMessage() {

        if (!alertsList) return;


        alertsList.innerHTML = `

            <article class="alert-card">

                <div class="alert-top">

                    <span class="alert-badge danger-badge">
                        اتصال
                    </span>

                    <span class="alert-time">
                        اکنون
                    </span>

                </div>


                <h3>
                    اتصال به سرور برقرار نشد
                </h3>


                <p>
                    سرور WAR ALERT در دسترس نیست.
                    ابتدا اجرای server/main.py را بررسی کنید.
                </p>


                <div class="alert-source">
                    آدرس API:
                    ${escapeHTML(API_BASE)}
                </div>

            </article>

        `;

    }


    // ==================================================
    // تعیین وضعیت کلی
    // ==================================================

    function updateStatus() {

        if (
            !statusTitle ||
            !statusDescription
        ) {

            return;

        }


        const alerts =
            getCurrentAlerts();


        /*
         * فقط هشدارهای تأییدشده
         * می‌توانند وضعیت اصلی برنامه
         * را تغییر دهند.
         */

        const hasDanger =
            alerts.some(
                alert =>
                    alert.type === "danger" &&
                    alert.verified === true
            );


        const hasWarning =
            alerts.some(
                alert =>
                    alert.type === "warning" &&
                    alert.verified === true
            );


        // هشدار فوری

        if (hasDanger) {

            statusTitle.textContent =
                "هشدار فوری";


            statusDescription.textContent =
                `برای ${
                    currentCity ||
                    "منطقه انتخابی"
                } یک هشدار تأییدشده وجود دارد.`;


            setStatusStyle("danger");

            return;

        }


        // هشدار

        if (hasWarning) {

            statusTitle.textContent =
                "هشدار";


            statusDescription.textContent =
                `برای ${
                    currentCity ||
                    "منطقه انتخابی"
                } اطلاعیه هشدار تأییدشده وجود دارد.`;


            setStatusStyle("warning");

            return;

        }


        // وضعیت عادی

        statusTitle.textContent =
            "وضعیت عادی";


        if (currentCity) {

            statusDescription.textContent =
                `در حال حاضر هشدار تأییدشده‌ای برای ${currentCity} ثبت نشده است.`;

        }

        else {

            statusDescription.textContent =
                "برای دریافت اطلاعیه‌های مربوط به منطقه، ابتدا شهر خود را انتخاب کنید.";

        }


        setStatusStyle("normal");

    }


    // ==================================================
    // ظاهر وضعیت
    // ==================================================

    function setStatusStyle(type) {

        if (
            !statusCard ||
            !statusIcon
        ) {

            return;

        }


        statusCard.classList.remove(
            "normal",
            "warning",
            "danger"
        );


        statusCard.classList.add(type);


        if (type === "danger") {

            statusIcon.textContent =
                "⚠";

        }

        else if (type === "warning") {

            statusIcon.textContent =
                "!";

        }

        else {

            statusIcon.textContent =
                "✓";

        }

    }


    // ==================================================
    // بروزرسانی دستی
    // ==================================================

    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            async () => {

                if (refreshBtn.disabled) {
                    return;
                }


                refreshBtn.disabled =
                    true;


                const oldText =
                    refreshBtn.textContent;


                refreshBtn.textContent =
                    "در حال بروزرسانی...";


                const success =
                    await fetchAlerts();


                refreshBtn.disabled =
                    false;


                refreshBtn.textContent =
                    oldText;


                if (success) {

                    showToast(
                        "اطلاعات از سرور دریافت شد"
                    );

                }

                else {

                    showToast(
                        "اتصال به سرور برقرار نشد"
                    );

                }

            }
        );

    }


    // ==================================================
    // اعلان‌های مرورگر
    // ==================================================

    function updateNotificationButton() {

        if (!notificationBtn) return;


        if (
            notificationEnabled &&
            "Notification" in window &&
            Notification.permission ===
                "granted"
        ) {

            notificationBtn.textContent =
                "فعال است";

        }

        else {

            notificationBtn.textContent =
                "فعال‌سازی";

        }

    }


    async function enableNotifications() {

        if (
            !("Notification" in window)
        ) {

            showToast(
                "مرورگر شما از اعلان پشتیبانی نمی‌کند"
            );

            return;

        }


        try {

            const permission =
                await Notification.requestPermission();


            if (permission === "granted") {

                notificationEnabled =
                    true;


                localStorage.setItem(
                    "warAlertNotifications",
                    "true"
                );


                updateNotificationButton();


                showToast(
                    "اعلان‌ها فعال شدند"
                );


                new Notification(
                    "هشدار",
                    {
                        body:
                            "اعلان‌های برنامه فعال شدند."
                    }
                );

            }

            else {

                notificationEnabled =
                    false;


                localStorage.setItem(
                    "warAlertNotifications",
                    "false"
                );


                updateNotificationButton();


                showToast(
                    "اجازه اعلان داده نشد"
                );

            }

        }

        catch (error) {

            console.error(
                "Notification error:",
                error
            );


            showToast(
                "فعال‌سازی اعلان انجام نشد"
            );

        }

    }


    if (notificationBtn) {

        notificationBtn.addEventListener(
            "click",
            enableNotifications
        );

    }


    // ==================================================
    // وضعیت اینترنت
    // ==================================================

    function updateConnectionStatus() {

        const connection =
            document.querySelector(
                ".connection"
            );


        if (!connection) return;


        if (navigator.onLine) {

            connection.innerHTML = `
                <span class="connection-dot"></span>
                آنلاین
            `;

        }

        else {

            connection.innerHTML = `
                <span
                    class="connection-dot"
                    style="background:#dc2626;"
                ></span>
                آفلاین
            `;

        }

    }


    window.addEventListener(
        "online",
        () => {

            updateConnectionStatus();

            showToast(
                "اتصال اینترنت برقرار شد"
            );

            fetchAlerts();

        }
    );


    window.addEventListener(
        "offline",
        () => {

            updateConnectionStatus();

            showToast(
                "اتصال اینترنت قطع شد"
            );

        }
    );


    // ==================================================
    // بروزرسانی خودکار
    // ==================================================

    setInterval(
        () => {

            if (navigator.onLine) {

                fetchAlerts();

            }

        },
        30000
    );


    // ==================================================
    // شروع برنامه
    // ==================================================

    updateCityUI();

    updateConnectionStatus();

    updateNotificationButton();

    renderAlerts();

    updateStatus();


    // دریافت اولیه از سرور

    fetchAlerts();


    // ==================================================
    // Console
    // ==================================================

    console.log(
        `WAR ALERT v${APP_VERSION} started successfully`
    );

    console.log(
        `API: ${API_BASE}`
    );

});
