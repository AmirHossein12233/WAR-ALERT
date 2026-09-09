```javascript
"use strict";

/*
=========================================
 WAR ALERT - ALERT DATA
 نسخه 1.0.0
=========================================
*/

/*
این فایل فعلاً داده‌های آزمایشی برنامه است.

مهم:
اطلاعیه‌های این فایل واقعی نیستند و فقط برای
تست رابط کاربری استفاده می‌شوند.

در مرحله اتصال به سرور، این داده‌ها از API
معتبر دریافت خواهند شد.
*/

const WAR_ALERT_DATA = {

    updatedAt: new Date().toISOString(),

    alerts: [

        {
            id: 1,

            type: "info",

            title: "سامانه اطلاع‌رسانی آماده است",

            description:
                "این پیام آزمایشی است و برای بررسی عملکرد برنامه نمایش داده می‌شود.",

            city: "همه",

            source:
                "سامانه هشدار - آزمایشی",

            time:
                "اکنون",

            verified: false
        },


        {
            id: 2,

            type: "normal",

            title: "اطلاعیه آزمایشی",

            description:
                "در این نسخه هیچ هشدار اضطراری واقعی اعلام نشده است.",

            city: "همه",

            source:
                "داده آزمایشی",

            time:
                "امروز",

            verified: false
        }

    ]

};


/*
=========================================
 دریافت اطلاعیه‌ها
=========================================
*/

function getAlerts() {

    return WAR_ALERT_DATA.alerts;
}


/*
=========================================
 دریافت اطلاعیه‌های یک شهر
=========================================
*/

function getAlertsForCity(city) {

    if (!city) {
        return [];
    }

    return WAR_ALERT_DATA.alerts.filter(alert => {

        return (
            alert.city === "همه" ||
            alert.city === city
        );

    });

}


/*
=========================================
 زمان آخرین بروزرسانی
=========================================
*/

function getDataUpdateTime() {

    return WAR_ALERT_DATA.updatedAt;
}
```
