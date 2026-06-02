import "server-only";

// Server-only Telegram admin notifications via the @NusaNotif_bot bot.
// Non-blocking: every function swallows errors so a Telegram outage never fails
// a payment/order. No-ops (with a warning) when env is not configured.

const API = "https://api.telegram.org";

function config() {
  return {
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
  };
}

export async function notifyTelegram(text: string): Promise<void> {
  const { token, chatId } = config();
  if (!token || !chatId) {
    console.warn("[telegram] not configured — skipping message");
    return;
  }
  try {
    await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("[telegram] sendMessage failed", err);
  }
}

// Sends a photo (e.g. transfer proof) with caption. Falls back to a text
// message if the photo upload fails.
export async function notifyTelegramPhoto(
  photo: Uint8Array | ArrayBuffer,
  caption: string,
  filename = "bukti-transfer.jpg",
): Promise<void> {
  const { token, chatId } = config();
  if (!token || !chatId) {
    console.warn("[telegram] not configured — skipping photo");
    return;
  }
  try {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
    const bytes = photo instanceof Uint8Array ? photo : new Uint8Array(photo);
    form.append("photo", new Blob([bytes as unknown as BlobPart]), filename);
    const res = await fetch(`${API}/bot${token}/sendPhoto`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(`sendPhoto HTTP ${res.status}`);
  } catch (err) {
    console.error("[telegram] sendPhoto failed, falling back to text", err);
    await notifyTelegram(caption);
  }
}
