const notConfigured = Object.freeze({
  ok: false,
  code: "not_configured",
  message: "Secure subscriptions are not available yet.",
});

export const placeholderBillingProvider = Object.freeze({
  id: "not_configured",
  isConfigured: false,
  async startCheckout() {
    return {...notConfigured};
  },
  async openBillingPortal() {
    return {...notConfigured};
  },
});
