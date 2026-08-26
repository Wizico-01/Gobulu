// Flutterwave Inline checkout. Passing a payment_plan makes this a
// recurring subscription — Flutterwave handles the monthly auto-debit
// itself, no cron job or manual re-charge logic needed on our side.
const FLW_PUBLIC_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;

function loadFlutterwaveScript() {
  return new Promise((resolve, reject) => {
    if (window.FlutterwaveCheckout) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export async function startFlutterwaveCheckout({ email, name, paymentPlanId, onSuccess, onClose }) {
  await loadFlutterwaveScript();
  window.FlutterwaveCheckout({
    public_key: FLW_PUBLIC_KEY,
    tx_ref: `confluence-${Date.now()}`,
    amount: 1,
    currency: "USD",
    payment_plan: paymentPlanId,
    customer: { email, name },
    customizations: { title: "Confluence", description: "Monthly subscription" },
    callback: (response) => onSuccess?.(response),
    onclose: () => onClose?.(),
  });
}