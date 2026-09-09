"use strict";

/*
=========================================================
WAR ALERT
ADMIN LOGIN
=========================================================
*/

const API_BASE = "https://war-alert.onrender.com";

const loginForm =
    document.getElementById("loginForm");

const tokenInput =
    document.getElementById("token");

const loginBtn =
    document.getElementById("loginBtn");

const message =
    document.getElementById("message");


/*
=========================================================
MESSAGE
=========================================================
*/

function showMessage(text, type = "") {

    message.textContent = text;

    message.className =
        type
            ? `message ${type}`
            : "message";
}


/*
=========================================================
CHECK EXISTING LOGIN
=========================================================
*/

const savedToken =
    localStorage.getItem("warAlertAdminToken");

if (savedToken) {

    tokenInput.value = savedToken;

}


/*
=========================================================
LOGIN
=========================================================
*/

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const token =
            tokenInput.value.trim();

        if (!token) {

            showMessage(
                "رمز مدیریت را وارد کنید.",
                "error"
            );

            return;
        }


        loginBtn.disabled = true;

        loginBtn.textContent =
            "در حال بررسی...";

        showMessage("");


        try {

            /*
             * ابتدا بررسی می‌کنیم
             * که سرور فعال باشد.
             */

            const serverResponse =
                await fetch(
                    `${API_BASE}/api`,
                    {
                        method: "GET",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (!serverResponse.ok) {

                throw new Error(
                    "SERVER_ERROR"
                );

            }


            /*
             * برای بررسی توکن،
             * یک درخواست DELETE به یک ID
             * غیرواقعی می‌فرستیم.
             *
             * اگر پاسخ 404 باشد:
             * توکن صحیح است ولی آن ID وجود ندارد.
             */

            const testResponse =
                await fetch(
                    `${API_BASE}/api/admin/alerts/999999999`,
                    {
                        method: "DELETE",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            /*
             * توکن صحیح
             */

            if (
                testResponse.status === 404
            ) {

                localStorage.setItem(
                    "warAlertAdminToken",
                    token
                );

                showMessage(
                    "ورود موفق بود.",
                    "success"
                );

                setTimeout(
                    function () {

                        window.location.href =
                            "admin.html";

                    },
                    500
                );

                return;
            }


            /*
             * توکن اشتباه
             */

            if (
                testResponse.status === 401 ||
                testResponse.status === 403
            ) {

                localStorage.removeItem(
                    "warAlertAdminToken"
                );

                showMessage(
                    "رمز مدیریت اشتباه است.",
                    "error"
                );

                return;
            }


            /*
             * حالت غیرمنتظره
             */

            if (testResponse.ok) {

                localStorage.setItem(
                    "warAlertAdminToken",
                    token
                );

                showMessage(
                    "ورود موفق بود.",
                    "success"
                );

                setTimeout(
                    function () {

                        window.location.href =
                            "admin.html";

                    },
                    500
                );

                return;
            }


            showMessage(
                "خطا در بررسی رمز مدیریت.",
                "error"
            );

        }

        catch (error) {

            console.error(
                "ADMIN LOGIN ERROR:",
                error
            );

            showMessage(
                "اتصال به سرور برقرار نشد. ابتدا FastAPI را اجرا کنید.",
                "error"
            );

        }

        finally {

            loginBtn.disabled = false;

            loginBtn.textContent =
                "ورود به پنل مدیریت";

        }

    }
);