import { FormEvent, useState } from "react";
import { hasFirebaseConfig } from "../firebase";
import type { CartItem } from "../types";
import { clearCart, decreaseQuantity, increaseQuantity, removeFromCart } from "../utils/cart";
import { createOrder } from "../utils/firestoreOrders";
import { buildTelegramShareUrl, buildWhatsAppShareUrl } from "../utils/share";
import { hasClientTelegramConfig, sendTelegramOrder } from "../utils/telegram";

interface CartPageProps {
  items: CartItem[];
  uid: string | null;
  authError: string;
  onCartChange: (items: CartItem[]) => void;
}

export default function CartPage({ items, uid, authError, onCartChange }: CartPageProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [telegramShareUrl, setTelegramShareUrl] = useState<string | null>(null);
  const [whatsAppShareUrl, setWhatsAppShareUrl] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setTelegramShareUrl(null);
    setWhatsAppShareUrl(null);

    if (hasFirebaseConfig && !uid) {
      setError(authError || "Connecting to Firebase. Try again in a moment.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setSubmitting(true);
    const orderTime = new Date();
    const submittedItems = items;
    const submittedNote = note;

    try {
      await createOrder(submittedItems, submittedNote, uid ?? undefined);
      setTelegramShareUrl(buildTelegramShareUrl(submittedItems, submittedNote, orderTime));
      setWhatsAppShareUrl(buildWhatsAppShareUrl(submittedItems, submittedNote, orderTime));

      if (hasClientTelegramConfig()) {
        try {
          await sendTelegramOrder(submittedItems, submittedNote, orderTime);
          setSuccess("Order sent to Telegram ❤️");
        } catch (telegramError: unknown) {
          setSuccess("Order saved. Use the share buttons as backup.");
          setError(
            telegramError instanceof Error
              ? `Telegram send failed: ${telegramError.message}`
              : "Telegram send failed."
          );
        }
      } else {
        setSuccess("Order ready to send ❤️");
      }

      clearCart();
      onCartChange([]);
      setNote("");
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Could not send order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-section" aria-labelledby="cart-title">
      <div className="page-heading">
        <span className="eyebrow">Cart</span>
        <h2 id="cart-title">Ready to send?</h2>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h3>Your cart is empty</h3>
          <p>Pick a dish from the Menu tab.</p>
        </div>
      ) : (
        <form className="cart-form" onSubmit={handleSubmit}>
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-item" key={item.dishId}>
                <img src={item.image} alt="" />
                <div>
                  <h3>{item.name}</h3>
                  <span>{item.category}</span>
                </div>
                <div className="quantity-controls">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name}`}
                    onClick={() => onCartChange(decreaseQuantity(item.dishId, items))}
                  >
                    -
                  </button>
                  <strong>{item.quantity}</strong>
                  <button
                    type="button"
                    aria-label={`Increase ${item.name}`}
                    onClick={() => onCartChange(increaseQuantity(item.dishId, items))}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => onCartChange(removeFromCart(item.dishId, items))}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>

          <label className="field">
            <span>Order note</span>
            <textarea
              rows={4}
              placeholder="Less spicy, extra warm, or anything sweet..."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Sending..." : "Send Order"}
          </button>
        </form>
      )}

      {error ? <div className="alert error">{error}</div> : null}
      {success ? <div className="alert success">{success}</div> : null}

      {telegramShareUrl || whatsAppShareUrl ? (
        <div className="share-actions">
          {telegramShareUrl ? (
            <a className="share-button telegram" href={telegramShareUrl} target="_blank" rel="noreferrer">
              Share to Telegram
            </a>
          ) : null}
          {whatsAppShareUrl ? (
            <a className="share-button whatsapp" href={whatsAppShareUrl} target="_blank" rel="noreferrer">
              Share to WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
