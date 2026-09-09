"use strict";

/* =========================================================
   WAR ALERT - ADMIN LOGIN
   ========================================================= */

const API_BASE = "https://war-alert.onrender.com";

const loginForm = document.getElementById("loginForm");
const tokenInput = document.getElementById("token");
const loginButton = document.getElementById("loginButton");
const messageBox = document.getElementById("message");

function showMessage(message, type = "error") {
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `message ${type}`;
}

function setLoading(loading) {
    if (!loginButton) return;

    loginButton.disabled = loading;

    loginButton.textContent = loading
        ? "در حال بررسی..."
        : "ورود به پنل مدیریت";
}

async function checkToken(token) {
    /*
     * برای بررسی اعتبار توکن، درخواست حذف یک ID غیرواقعی
     * ارسال می‌کنیم.
     *
     * 404 = توکن معتبر است ولی هشدار وجود ندارد.
     * 401/403 = توکن اشتباه است.
     */

    const response = await fetch(
        `${API_BASE}/api/admin/alerts/999999999`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (response.status === 404) {
        return true;
    }

    if (
        response.status === 401 ||
        response.status === 403
    ) {
        return false;
    }

    /*
     * اگر سرور برای ID ساختگی پاسخ دیگری داد،
     * برای احتیاط معتبر در نظر نمی‌گیریم.
     */
    return false;
}

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const token =
            tokenInput?.value.trim() || "";

        if (!token) {
            showMessage(
                "توکن مدیریت را وارد کنید.",
                "error"
            );
            return;
        }

        setLoading(true);

        try {
            const valid = await checkToken(token);

            if (!valid) {
                showMessage(
                    "توکن مدیریت صحیح نیست.",
                    "error"
                );

                setLoading(false);
                return;
            }

            localStorage.setItem(
                "warAlertAdminToken",
                token
            );

            showMessage(
                "ورود موفق بود. در حال انتقال...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "admin.html";
            }, 500);
        } catch (error) {
            console.error(error);

            showMessage(
                "اتصال به سرور WAR ALERT برقرار نشد.",
                "error"
            );

            setLoading(false);
        }
    });
}

/* =========================================================
   If already logged in
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const savedToken =
        localStorage.getItem("warAlertAdminToken");

    if (savedToken && tokenInput) {
        tokenInput.value = "";
    }
});