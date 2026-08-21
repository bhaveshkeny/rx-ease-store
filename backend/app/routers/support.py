"""Order-aware support assistant with human-agent escalation."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_pharmacist
from ..database import get_db
from ..models import Order, SupportTicket, User
from ..schemas import SupportChatIn, SupportChatOut, SupportHandoffIn, SupportTicketOut

router = APIRouter(prefix="/api/support", tags=["support"])

STATUS_TEXT = {
    "placed": "placed and being prepared",
    "awaiting_verification": "awaiting pharmacist verification of your prescription",
    "dispensed": "dispensed and ready to ship",
    "delivered": "delivered",
    "cancelled": "cancelled",
}

HANDOFF_KEYWORDS = (
    "agent",
    "human",
    "pharmacist",
    "complaint",
    "refund",
    "wrong medicine",
    "side effect",
    "allergic",
    "dosage",
    "emergency",
    "speak to",
    "call me",
)


def _describe(order: Order) -> str:
    items = ", ".join(f"{i.quantity} x {i.name}" for i in order.items)
    status = STATUS_TEXT.get(order.status, order.status)
    return (
        f"Order {order.id[:8]} placed on {order.created_at:%d %b %Y} "
        f"for {order.total:.2f} is {status}. Items: {items or 'n/a'}."
    )


def answer(message: str, orders: list[Order]) -> tuple[str, bool]:
    """Return (reply, needs_human)."""
    text = message.lower().strip()

    if any(word in text for word in HANDOFF_KEYWORDS):
        return (
            "This needs a licensed pharmacist or support agent. I can transfer you to a human now.",
            True,
        )

    if not text:
        return ("Could you tell me a bit more about what you need help with?", False)

    if any(word in text for word in ("order", "status", "track", "delivery", "deliver", "where")):
        if not orders:
            return (
                "I can't see any orders on your account yet. Once you place one I can track it here.",
                False,
            )
        # Match on an order id fragment if the user pasted one.
        for order in orders:
            if order.id[:8].lower() in text or order.id.lower() in text:
                return (_describe(order), False)
        latest = orders[0]
        extra = f" You have {len(orders)} orders in total." if len(orders) > 1 else ""
        return (_describe(latest) + extra, False)

    if "prescription" in text or "upload" in text or "rx" in text:
        pending = [o for o in orders if o.status == "awaiting_verification"]
        if pending:
            return (
                f"Order {pending[0].id[:8]} is waiting on prescription verification. "
                "If you haven't uploaded a valid prescription yet, open the order and attach a "
                "JPG, PNG or PDF — our pharmacist reviews it within a few hours.",
                False,
            )
        return (
            "Prescription-only medicines need a valid prescription uploaded at checkout "
            "(JPG, PNG or PDF up to 10 MB). A pharmacist verifies it before dispensing.",
            False,
        )

    if "cancel" in text:
        return (
            "Orders can be cancelled until they are dispensed. Tell me the order number and I'll "
            "hand you to an agent who can cancel it for you.",
            True,
        )

    if "price" in text or "cost" in text or "shipping" in text or "fee" in text:
        return (
            "Delivery is free on orders of 30 and above; below that a 3.99 delivery fee applies. "
            "Item prices are shown in the shop and on your order summary.",
            False,
        )

    if any(word in text for word in ("hi", "hello", "hey", "thanks", "thank you")):
        return (
            "Hi! I can check your order status, explain prescription verification, or connect you "
            "with a human agent. What do you need?",
            False,
        )

    return (
        "I couldn't confidently answer that. I'll transfer you to a human support agent who can help.",
        True,
    )


@router.post("/chat", response_model=SupportChatOut)
def chat(
    payload: SupportChatIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc())
    orders = list(db.scalars(stmt))
    reply, needs_human = answer(payload.message, orders)
    return SupportChatOut(reply=reply, needs_human=needs_human)


@router.post("/handoff", response_model=SupportTicketOut, status_code=201)
def handoff(
    payload: SupportHandoffIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Please describe the issue")
    ticket = SupportTicket(
        user_id=user.id,
        message=payload.message.strip(),
        transcript=payload.transcript or "",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/tickets", response_model=list[SupportTicketOut])
def tickets(db: Session = Depends(get_db), _=Depends(require_pharmacist)):
    stmt = select(SupportTicket).order_by(SupportTicket.created_at.desc())
    return list(db.scalars(stmt))
