from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional
import json
import os
import secrets


# =========================================================
# CONFIG
# =========================================================

APP_NAME = "WAR ALERT"
APP_VERSION = "1.0.0"

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
ALERTS_FILE = DATA_DIR / "alerts.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)

ADMIN_TOKEN = os.getenv(
    "WAR_ALERT_ADMIN_TOKEN",
    "CHANGE-ME-123456"
)


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="سامانه اطلاع‌رسانی اضطراری"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# MODELS
# =========================================================

class AlertCreate(BaseModel):
    type: str = "info"
    title: str
    description: str
    city: str = "همه"
    source: str = "منبع نامشخص"
    verified: bool = False


class AlertUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    source: Optional[str] = None
    verified: Optional[bool] = None


# =========================================================
# HELPERS
# =========================================================

def now_iso():
    return datetime.now(timezone.utc).isoformat()


def default_data():
    return {
        "updatedAt": now_iso(),
        "alerts": [
            {
                "id": 1,
                "type": "info",
                "title": "سامانه اطلاع‌رسانی آماده است",
                "description": "این پیام آزمایشی است و برای بررسی عملکرد برنامه نمایش داده می‌شود.",
                "city": "همه",
                "source": "WAR ALERT - آزمایشی",
                "time": "اکنون",
                "verified": False
            }
        ]
    }


def save_data(data):
    data["updatedAt"] = now_iso()

    with ALERTS_FILE.open(
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            data,
            file,
            ensure_ascii=False,
            indent=4
        )


def load_data():
    if not ALERTS_FILE.exists():
        data = default_data()
        save_data(data)
        return data

    try:
        with ALERTS_FILE.open(
            "r",
            encoding="utf-8"
        ) as file:
            data = json.load(file)

        if not isinstance(data, dict):
            raise ValueError("Invalid data")

        if not isinstance(
            data.get("alerts"),
            list
        ):
            data["alerts"] = []

        return data

    except Exception:
        data = default_data()
        save_data(data)
        return data


def validate_type(alert_type):
    allowed = {
        "info",
        "normal",
        "warning",
        "danger"
    }

    if alert_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail="نوع اطلاعیه نامعتبر است."
        )


def check_admin(
    authorization: Optional[str]
):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="توکن مدیریت ارسال نشده است."
        )

    if not authorization.startswith(
        "Bearer "
    ):
        raise HTTPException(
            status_code=401,
            detail="فرمت توکن مدیریت اشتباه است."
        )

    token = authorization[7:].strip()

    if not ADMIN_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="WAR_ALERT_ADMIN_TOKEN تنظیم نشده است."
        )

    if not secrets.compare_digest(
        token,
        ADMIN_TOKEN
    ):
        raise HTTPException(
            status_code=403,
            detail="رمز مدیریت اشتباه است."
        )


def find_alert(
    alerts,
    alert_id
):
    for alert in alerts:
        try:
            current_id = int(
                alert.get("id", 0)
            )
        except (
            ValueError,
            TypeError
        ):
            continue

        if current_id == alert_id:
            return alert

    return None


def next_id(alerts):
    numbers = []

    for alert in alerts:
        try:
            numbers.append(
                int(
                    alert.get("id", 0)
                )
            )
        except (
            ValueError,
            TypeError
        ):
            pass

    if not numbers:
        return 1

    return max(numbers) + 1


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "status": "ok",
        "app": APP_NAME,
        "version": APP_VERSION,
        "message": "WAR ALERT API is running."
    }


# =========================================================
# API INFO
# =========================================================

@app.get("/api")
def api_info():
    return {
        "status": "ok",
        "app": APP_NAME,
        "version": APP_VERSION,
        "message": "سرور با موفقیت اجرا شده است."
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "server": APP_NAME,
        "time": now_iso()
    }


# =========================================================
# PUBLIC - ALL ALERTS
# =========================================================

@app.get("/api/alerts")
def get_alerts():
    data = load_data()

    return {
        "status": "ok",
        "updatedAt": data.get("updatedAt"),
        "alerts": data.get("alerts", [])
    }


# =========================================================
# PUBLIC - CITY ALERTS
# =========================================================

@app.get("/api/alerts/city/{city}")
def get_city_alerts(city: str):
    data = load_data()

    result = []

    for alert in data.get(
        "alerts",
        []
    ):
        alert_city = str(
            alert.get("city", "")
        ).strip()

        if (
            alert_city == "همه"
            or alert_city == city
        ):
            result.append(alert)

    return {
        "status": "ok",
        "city": city,
        "updatedAt": data.get("updatedAt"),
        "alerts": result
    }


# =========================================================
# CITIES
# =========================================================

@app.get("/api/cities")
def get_cities():
    return {
        "status": "ok",
        "cities": [
            "تهران",
            "اصفهان",
            "شیراز",
            "تبریز",
            "مشهد",
            "سایر"
        ]
    }


# =========================================================
# ADMIN - CREATE
# =========================================================

@app.post("/api/admin/alerts")
def create_alert(
    alert: AlertCreate,
    authorization: Optional[str] = Header(None)
):
    check_admin(authorization)

    validate_type(alert.type)

    title = alert.title.strip()
    description = alert.description.strip()
    city = alert.city.strip()
    source = alert.source.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="عنوان اطلاعیه نمی‌تواند خالی باشد."
        )

    if not description:
        raise HTTPException(
            status_code=400,
            detail="متن اطلاعیه نمی‌تواند خالی باشد."
        )

    if not city:
        city = "همه"

    if not source:
        raise HTTPException(
            status_code=400,
            detail="منبع اطلاعیه نمی‌تواند خالی باشد."
        )

    data = load_data()

    alerts = data.get(
        "alerts",
        []
    )

    new_alert = {
        "id": next_id(alerts),
        "type": alert.type,
        "title": title,
        "description": description,
        "city": city,
        "source": source,
        "time": "اکنون",
        "verified": alert.verified
    }

    alerts.insert(
        0,
        new_alert
    )

    data["alerts"] = alerts

    save_data(data)

    return {
        "status": "ok",
        "message": "اطلاعیه با موفقیت ثبت شد.",
        "alert": new_alert
    }


# =========================================================
# ADMIN - UPDATE
# =========================================================

@app.put("/api/admin/alerts/{alert_id}")
def update_alert(
    alert_id: int,
    alert: AlertUpdate,
    authorization: Optional[str] = Header(None)
):
    check_admin(authorization)

    data = load_data()

    alerts = data.get(
        "alerts",
        []
    )

    target = find_alert(
        alerts,
        alert_id
    )

    if target is None:
        raise HTTPException(
            status_code=404,
            detail="اطلاعیه پیدا نشد."
        )

    if alert.type is not None:
        validate_type(alert.type)
        target["type"] = alert.type

    if alert.title is not None:
        title = alert.title.strip()

        if not title:
            raise HTTPException(
                status_code=400,
                detail="عنوان نمی‌تواند خالی باشد."
            )

        target["title"] = title

    if alert.description is not None:
        description = (
            alert.description.strip()
        )

        if not description:
            raise HTTPException(
                status_code=400,
                detail="متن اطلاعیه نمی‌تواند خالی باشد."
            )

        target["description"] = description

    if alert.city is not None:
        city = alert.city.strip()
        target["city"] = city or "همه"

    if alert.source is not None:
        source = alert.source.strip()

        if not source:
            raise HTTPException(
                status_code=400,
                detail="منبع نمی‌تواند خالی باشد."
            )

        target["source"] = source

    if alert.verified is not None:
        target["verified"] = alert.verified

    target["time"] = "اکنون"

    data["alerts"] = alerts

    save_data(data)

    return {
        "status": "ok",
        "message": "اطلاعیه بروزرسانی شد.",
        "alert": target
    }


# =========================================================
# ADMIN - DELETE
# =========================================================

@app.delete("/api/admin/alerts/{alert_id}")
def delete_alert(
    alert_id: int,
    authorization: Optional[str] = Header(None)
):
    check_admin(authorization)

    data = load_data()

    alerts = data.get(
        "alerts",
        []
    )

    target = find_alert(
        alerts,
        alert_id
    )

    if target is None:
        raise HTTPException(
            status_code=404,
            detail="اطلاعیه پیدا نشد."
        )

    data["alerts"] = [
        item
        for item in alerts
        if item is not target
    ]

    save_data(data)

    return {
        "status": "ok",
        "message": "اطلاعیه حذف شد."
    }


# =========================================================
# TIME
# =========================================================

@app.get("/api/time")
def get_time():
    data = load_data()

    return {
        "serverTime": now_iso(),
        "dataUpdatedAt": data.get(
            "updatedAt"
        )
    }


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":
    import uvicorn

    port = int(
        os.getenv(
            "PORT",
            "8000"
        )
    )

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )