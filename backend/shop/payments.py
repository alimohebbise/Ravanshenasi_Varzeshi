import uuid
from dataclasses import dataclass


@dataclass
class PaymentResult:
    success: bool
    reference: str


class MockPaymentGateway:
    """Simulated payment gateway. Swap this class (or its call site in
    views.py) for a real gateway client (e.g. Zarinpal) later — callers
    only depend on the `charge()` -> PaymentResult contract."""

    def charge(self, order, simulate_success: bool) -> PaymentResult:
        return PaymentResult(success=simulate_success, reference=uuid.uuid4().hex)
