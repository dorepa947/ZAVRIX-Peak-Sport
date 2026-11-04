/* ZAVRIX SPORT — customer order form
 * Public Supabase key only. Never put a Supabase secret/service_role key here.
 * Set the three EmailJS values below after connecting the seller Gmail account.
 */
(function () {
  "use strict";

  const CONFIG = {
    supabaseUrl: "https://usecbrtftqfgrqdqdggu.supabase.co",
    supabasePublishableKey: "sb_publishable_jKnx0fRwUhSipbtj7A0MIA_0LupoxmG",
    notificationEmail: "zavrixsport@gmail.com",
    emailJsPublicKey: "ADD_EMAILJS_PUBLIC_KEY",
    emailJsServiceId: "ADD_EMAILJS_SERVICE_ID",
    emailJsTemplateId: "ADD_EMAILJS_TEMPLATE_ID"
  };

  let db = null;
  let currentProduct = null;
  let openedAt = 0;

  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);

  function ensureDialog() {
    if (document.getElementById("zavrix-order-dialog")) return;

    const style = document.createElement("style");
    style.id = "zavrix-order-dialog-styles";
    style.textContent = `
      #zavrix-order-dialog{width:min(580px,calc(100% - 24px));max-height:92vh;overflow:auto;padding:0;border:1px solid rgba(220,232,250,.32);border-radius:8px;background:#090d14;color:#f5f7fb;box-shadow:0 25px 90px #000c;font-family:Arial,Helvetica,sans-serif}
      #zavrix-order-dialog::backdrop{background:rgba(0,0,0,.82);backdrop-filter:blur(5px)}
      .zo-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:17px 20px;background:#0b1018;border-bottom:1px solid rgba(220,232,250,.15)}
      .zo-head strong{font-size:17px;letter-spacing:1.4px}.zo-close{width:34px;height:34px;border:1px solid #64748b;background:#111722;color:#fff;border-radius:50%;font-size:20px;cursor:pointer}
      .zo-body{padding:20px}.zo-product{padding:12px 14px;margin:0 0 15px;border:1px solid rgba(220,232,250,.2);background:#111722;border-radius:5px}
      .zo-product small{display:block;color:#aebbd0;font-size:9px;letter-spacing:1.5px;text-transform:uppercase}.zo-product strong{display:block;margin-top:5px;font-size:15px}.zo-product span{display:block;margin-top:5px;color:#dce7f8;font-weight:800;font-size:13px}
      .zo-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.zo-field{display:flex;flex-direction:column;gap:6px;margin-bottom:11px}.zo-field.full{grid-column:1/-1}.zo-field label{color:#c7d2e2;font-size:11px;font-weight:700;letter-spacing:.3px}
      .zo-field input,.zo-field select,.zo-field textarea{width:100%;min-height:42px;border:1px solid rgba(214,227,247,.25);border-radius:4px;background:#101722;color:#f6f8fc;padding:10px 11px;font:13px Arial,Helvetica,sans-serif;outline:none}
      .zo-field textarea{min-height:75px;resize:vertical}.zo-field input:focus,.zo-field select:focus,.zo-field textarea:focus{border-color:#a9c3ee}
      .zo-submit{width:100%;min-height:46px;border:1px solid #eef3fb;border-radius:4px;background:linear-gradient(120deg,#edf2f9,#aebbd0);color:#060910;font-weight:900;letter-spacing:1px;cursor:pointer}.zo-submit:disabled{opacity:.55;cursor:wait}
      .zo-note{font-size:10px;line-height:1.5;color:#9aa8bc;margin:10px 0 0}.zo-status{min-height:20px;font-size:12px;line-height:1.5;margin:10px 0 0;color:#f0c98b}.zo-success{padding:25px 12px;text-align:center}.zo-success h3{margin:0 0 9px;color:#e5edf9}.zo-success p{font-size:13px;color:#b7c2d3;line-height:1.6}.zo-success button{margin-top:14px;padding:12px 28px;border:0;border-radius:4px;background:#e5ebf5;color:#080b10;font-weight:900;cursor:pointer}
      .zo-hp{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;opacity:0!important}
      @media(max-width:520px){.zo-body{padding:15px}.zo-grid{grid-template-columns:1fr}.zo-field.full{grid-column:auto}.zo-head{padding:14px 15px}}
    `;
    document.head.append(style);

    const dialog = document.createElement("dialog");
    dialog.id = "zavrix-order-dialog";
    dialog.innerHTML = `
      <div class="zo-head"><strong>ZAVRIX SPORT · PLACE ORDER</strong><button class="zo-close" type="button" aria-label="Close order form">×</button></div>
      <div class="zo-body">
        <div class="zo-product"><small>Selected product</small><strong id="zo-product-name">ZAVRIX Product</strong><span id="zo-product-price"></span></div>
        <form id="zo-order-form" novalidate>
          <div class="zo-grid">
            <div class="zo-field"><label for="zo-name">Full name *</label><input id="zo-name" name="customer_name" autocomplete="name" required maxlength="100" placeholder="Your full name"></div>
            <div class="zo-field"><label for="zo-whatsapp">WhatsApp number *</label><input id="zo-whatsapp" name="whatsapp_number" autocomplete="tel" required maxlength="35" placeholder="+92 3xx xxxxxxx"></div>
            <div class="zo-field"><label for="zo-email">Email (optional)</label><input id="zo-email" name="customer_email" type="email" autocomplete="email" maxlength="150" placeholder="you@example.com"></div>
            <div class="zo-field"><label for="zo-country">Country *</label><input id="zo-country" name="country" autocomplete="country-name" required maxlength="80" placeholder="Country"></div>
            <div class="zo-field"><label for="zo-size">Size *</label><select id="zo-size" name="size" required><option value="">Select size</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option><option>XXXL</option><option>Custom size</option></select></div>
            <div class="zo-field"><label for="zo-color">Color *</label><input id="zo-color" name="color" required maxlength="60" placeholder="e.g. Black"></div>
            <div class="zo-field"><label for="zo-quantity">Quantity *</label><input id="zo-quantity" name="quantity" type="number" min="1" max="5000" step="1" value="1" required></div>
            <div class="zo-field full"><label for="zo-address">Delivery address *</label><textarea id="zo-address" name="delivery_address" required maxlength="1000" placeholder="Complete delivery address"></textarea></div>
            <div class="zo-field full"><label for="zo-notes">Additional details (optional)</label><textarea id="zo-notes" name="customer_notes" maxlength="1000" placeholder="Logo, customization, deadline, or other details"></textarea></div>
          </div>
          <div class="zo-hp" aria-hidden="true"><label for="zo-website">Leave this field empty</label><input id="zo-website" name="website" tabindex="-1" autocomplete="off"></div>
          <button class="zo-submit" id="zo-submit" type="submit">SUBMIT ORDER</button>
          <p class="zo-note">Submitting this form sends your order request to ZAVRIX SPORT. Our team will contact you to confirm the final price, shipping and payment.</p>
          <p class="zo-status" id="zo-status" role="status" aria-live="polite"></p>
        </form>
        <div class="zo-success" id="zo-success" hidden><h3>Order request received</h3><p id="zo-success-message"></p><button type="button" id="zo-done">DONE</button></div>
      </div>`;
    document.body.append(dialog);
    dialog.querySelector(".zo-close").addEventListener("click", () => dialog.close());
    dialog.querySelector("#zo-done").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    dialog.querySelector("#zo-order-form").addEventListener("submit", submitOrder);
  }

  function isEmailConfigured() {
    return window.emailjs &&
      !CONFIG.emailJsPublicKey.startsWith("ADD_") &&
      !CONFIG.emailJsServiceId.startsWith("ADD_") &&
      !CONFIG.emailJsTemplateId.startsWith("ADD_");
  }

  function openOrder(product) {
    ensureDialog();
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      alert("The order system could not connect. Please refresh the page and try again.");
      return;
    }
    currentProduct = product || {};
    const name = currentProduct.name || "ZAVRIX Product";
    const label = currentProduct.priceLabel || currentProduct.price_label ||
      (Number.isFinite(Number(currentProduct.price_usd)) ? "$" + Number(currentProduct.price_usd).toFixed(2) + " USD" : "Price on request");
    document.getElementById("zo-product-name").textContent = name;
    document.getElementById("zo-product-price").textContent = label;
    const form = document.getElementById("zo-order-form");
    form.reset();
    document.getElementById("zo-status").textContent = "";
    document.getElementById("zo-submit").disabled = false;
    form.hidden = false;
    document.getElementById("zo-success").hidden = true;
    openedAt = Date.now();
    const dialog = document.getElementById("zavrix-order-dialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  async function sendOwnerEmail(order, orderId) {
    if (!isEmailConfigured()) return { sent: false, reason: "EmailJS setup is not complete yet." };
    const params = {
      to_email: CONFIG.notificationEmail,
      order_subject: `New ZAVRIX SPORT order #${orderId.slice(0, 8)}`,
      order_id: orderId,
      customer_name: order.customer_name,
      customer_whatsapp: order.whatsapp_number,
      customer_email: order.customer_email || "Not provided",
      country: order.country,
      delivery_address: order.delivery_address,
      product_name: order.product_name,
      product_category: order.product_category || "Sportswear",
      price_label: order.price_label || (order.price_usd ? `$${Number(order.price_usd).toFixed(2)} USD` : "Price on request"),
      size: order.size,
      color: order.color,
      quantity: String(order.quantity),
      customer_notes: order.customer_notes || "None"
    };
    try {
      await window.emailjs.send(CONFIG.emailJsServiceId, CONFIG.emailJsTemplateId, params, {
        publicKey: CONFIG.emailJsPublicKey,
        limitRate: { id: "zavrix-order-email", throttle: 10000 }
      });
      return { sent: true };
    } catch (error) {
      console.error("ZAVRIX order email failed:", error);
      return { sent: false, reason: error?.text || error?.message || "Email could not be sent." };
    }
  }

  async function submitOrder(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.getElementById("zo-status");
    const submit = document.getElementById("zo-submit");
    if (form.elements.website.value.trim()) return;
    if (Date.now() - openedAt < 1200) {
      status.textContent = "Please review the form and try again.";
      return;
    }
    if (!form.reportValidity()) return;
    const quantity = Number(form.elements.quantity.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5000) {
      status.textContent = "Please enter a quantity between 1 and 5,000.";
      return;
    }

    const product = currentProduct || {};
    const price = Number(product.price_usd ?? product.priceMin ?? NaN);
    const orderId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
      "zv-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    const order = {
      id: orderId,
      customer_name: form.elements.customer_name.value.trim(),
      customer_email: form.elements.customer_email.value.trim() || null,
      whatsapp_number: form.elements.whatsapp_number.value.trim(),
      country: form.elements.country.value.trim(),
      delivery_address: form.elements.delivery_address.value.trim(),
      product_id: product.id === undefined || product.id === null ? null : String(product.id),
      product_name: String(product.name || "ZAVRIX Product").slice(0, 150),
      product_category: String(product.category || "Sportswear").slice(0, 80),
      price_usd: Number.isFinite(price) && price >= 0 ? price : null,
      price_label: String(product.priceLabel || product.price_label || "").slice(0, 80) || null,
      size: form.elements.size.value,
      color: form.elements.color.value.trim(),
      quantity,
      customer_notes: form.elements.customer_notes.value.trim() || null
    };

    submit.disabled = true;
    status.textContent = "Submitting your order…";
    try {
      if (!db) db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabasePublishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      const { error } = await db.from("orders").insert(order);
      if (error) throw error;

      // The database save is the primary action. Email is a notification,
      // so an email-provider issue must not undo or duplicate the order.
      const emailResult = await sendOwnerEmail(order, orderId);
      form.hidden = true;
      const success = document.getElementById("zo-success");
      success.hidden = false;
      const suffix = emailResult.sent
        ? `An email alert was sent to ${CONFIG.notificationEmail}.`
        : `Your order is saved in the Admin Panel. Email alert is not active yet (${emailResult.reason}).`;
      document.getElementById("zo-success-message").textContent =
        `Your order reference is ${orderId.slice(0, 8).toUpperCase()}. ${suffix} ZAVRIX SPORT will contact you to confirm the order.`;
    } catch (error) {
      console.error("ZAVRIX order submission failed:", error);
      status.textContent = "Order could not be saved: " + (error?.message || "Please try again later.");
      submit.disabled = false;
    }
  }

  function bindFeaturedButtons() {
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-featured-order]");
      if (!button) return;
      openOrder({
        name: button.dataset.name,
        category: button.dataset.category,
        price_usd: Number(button.dataset.priceMin),
        priceMin: Number(button.dataset.priceMin),
        priceLabel: button.dataset.priceLabel
      });
    });
  }

  ensureDialog();
  bindFeaturedButtons();
  window.ZavrixOrders = { open: openOrder };
})();
