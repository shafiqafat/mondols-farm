export const WHATSAPP_NUMBER = "8801534282793";

export function openWhatsApp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message,
  )}`;

  window.open(url, "_blank");
}
