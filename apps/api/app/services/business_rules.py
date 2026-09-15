import random
import string


def delivery_charge(distance_km: float, override: bool = False) -> dict:
    if distance_km <= 20:
        return {"deliverable": True, "charge": 0}
    if distance_km <= 30:
        return {"deliverable": True, "charge": 40}
    if distance_km <= 40:
        return {"deliverable": True, "charge": 70}
    if distance_km <= 60:
        return {"deliverable": True, "charge": 100}
    return {"deliverable": override, "charge": 150 if override else None}


def wallet_points(order_total: float) -> int:
    return int(order_total * 0.02)


def can_redeem_wallet(points: int) -> bool:
    return points >= 100


def generate_referral_code(existing: set[str] | None = None) -> str:
    existing = existing or set()
    alphabet = string.ascii_uppercase
    for _ in range(500):
        code = "".join(random.sample(alphabet, 4))
        if code not in existing:
            return code
    raise RuntimeError("Unable to generate referral code")


def apply_coupon(code: str, subtotal: float) -> dict:
    if code.upper() == "SAVE05":
        return {"valid": True, "discount": round(subtotal * 0.05, 2)}
    return {"valid": False, "discount": 0}


def first_order_discount(subtotal: float, address_allowed: bool) -> float:
    return round(subtotal * 0.2, 2) if address_allowed else 0
