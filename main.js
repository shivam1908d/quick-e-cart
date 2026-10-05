
// EmailJS is initialized once so the checkout form can send order details without a backend.
// These values must match the public key, service, and template configured in the EmailJS dashboard.
const EMAILJS_PUBLIC_KEY  = "F0lBEsDGRVvZw2Cbe";   // replace with your EmailJS Public Key
const EMAILJS_SERVICE_ID  = "service_yiohpvd";   // replace with your EmailJS Service ID
const EMAILJS_TEMPLATE_ID = "template_wzllykc";  // replace with your EmailJS Template ID
const OWNER_EMAIL = "knight8601@gmail.com";



emailjs.init(EMAILJS_PUBLIC_KEY);

// The product list is the single source of truth for the cards rendered in #productGrid.
const PRODUCTS = [
  { id: 1, name: "Wirless Mouse", price: 149, image: "https://i.ibb.co/yFr0P33p/image.jpg" },
  { id: 2, name: "Flower Hair Clip", price: 249, image: "https://i.ibb.co/chKzpf73/image.jpg" },
  { id: 3, name: "Headphone ", price: 399, image: "https://i.ibb.co/PG9tSjFw/image.jpg" }
];

// cart stores each product ID with its quantity, while picker keeps the quantity selected in each card before the user adds it.
let cart = [];                 // [{ id, qty }]
const picker = {};             // quantity chosen on each product card
PRODUCTS.forEach(p => (picker[p.id] = 1));

// Small DOM and currency helpers keep the cart and product cards consistent across the page.
const $ = id => document.getElementById(id);
const rupees = n => "₹" + n.toLocaleString("en-IN");
const findProduct = id => PRODUCTS.find(p => p.id === id);
const cartCount = () => cart.reduce((s, i) => s + i.qty, 0);
const cartTotal = () => cart.reduce((s, i) => s + i.qty * findProduct(i.id).price, 0);

// Short confirmation messages appear in the floating #toast element after add-to-cart or order actions.
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 1800);
}

// The product cards in #productGrid are recreated from the catalog so the UI reflects any product data changes immediately.
function renderProducts() {
  $("productGrid").innerHTML = PRODUCTS.map(p => `
    <article class="card">
      <div class="card__img"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
      <div class="card__body">
        <h3 class="card__name">${p.name}</h3>
        <p class="card__price">${rupees(p.price)}</p>
        <div class="card__actions">
          <div class="qty" aria-label="Quantity for ${p.name}">
            <button type="button" data-act="dec" data-id="${p.id}" aria-label="Decrease quantity">&minus;</button>
            <span id="pq-${p.id}">1</span>
            <button type="button" data-act="inc" data-id="${p.id}" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="add-btn" id="add-${p.id}" data-act="add" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>`).join("");
}

// The cart drawer in #cartList is re-rendered every time quantities change so the subtotal, total, and badge stay aligned.
function renderCart() {
  const list = $("cartList");
  const empty = cart.length === 0;

  list.innerHTML = empty
    ? `<li class="empty">Your cart is empty. Add something from Today's picks.</li>`
    : cart.map(item => {
        const p = findProduct(item.id);
        return `
        <li class="cart-item">
          <img src="${p.image}" alt="${p.name}">
          <div>
            <p class="cart-item__name">${p.name}</p>
            <p class="cart-item__price">${rupees(p.price)} each</p>
            <div class="qty">
              <button type="button" data-cart="dec" data-id="${p.id}" aria-label="Decrease">&minus;</button>
              <span>${item.qty}</span>
              <button type="button" data-cart="inc" data-id="${p.id}" aria-label="Increase">+</button>
            </div>
          </div>
          <div class="cart-item__right">
            ${rupees(item.qty * p.price)}<br>
            <button type="button" class="remove" data-cart="remove" data-id="${p.id}">Remove</button>
          </div>
        </li>`;
      }).join("");

  $("subtotal").textContent = rupees(cartTotal());
  $("total").textContent = rupees(cartTotal());
  $("totals").style.display = empty ? "none" : "grid";
  $("checkoutForm").style.display = empty ? "none" : "grid";

  // The cart badge updates immediately so the header count reflects the current total quantity.
  const badge = $("cartCount");
  badge.textContent = cartCount();
  badge.classList.remove("bump");
  void badge.offsetWidth;            // restart animation
  badge.classList.add("bump");
}

// These two helpers are the main data flow for cart updates: they mutate the cart array and then redraw the drawer view.
function addToCart(id, qty) {
  const line = cart.find(i => i.id === id);
  line ? (line.qty += qty) : cart.push({ id, qty });
  renderCart();
}

function changeQty(id, delta) {
  const line = cart.find(i => i.id === id);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter(i => i.id !== id);
  renderCart();
}

// Event delegation keeps the logic simple because the product controls are generated dynamically in #productGrid.
$("productGrid").addEventListener("click", e => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = Number(btn.dataset.id);

  if (btn.dataset.act === "inc") picker[id] = Math.min(picker[id] + 1, 20);
  if (btn.dataset.act === "dec") picker[id] = Math.max(picker[id] - 1, 1);
  $("pq-" + id).textContent = picker[id];

  if (btn.dataset.act === "add") {
    addToCart(id, picker[id]);
    toast(`${picker[id]} × ${findProduct(id).name} added`);
    // This temporary state gives the user a clear success signal without changing the product data.
    btn.textContent = "Added ✓";
    btn.classList.add("added");
    setTimeout(() => { btn.textContent = "Add to cart"; btn.classList.remove("added"); }, 1200);
    picker[id] = 1;
    $("pq-" + id).textContent = 1;
  }
});

// The cart drawer buttons are bound through event delegation so quantity changes and removals work on each rendered row.
$("cartList").addEventListener("click", e => {
  const btn = e.target.closest("button[data-cart]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.cart === "inc") changeQty(id, 1);
  if (btn.dataset.cart === "dec") changeQty(id, -1);
  if (btn.dataset.cart === "remove") changeQty(id, -cart.find(i => i.id === id).qty);
});

// The drawer and overlay are toggled together to keep the cart panel and backdrop in sync.
function openCart() {
  $("drawer").classList.add("open");
  $("overlay").classList.add("open");
  $("drawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeCart() {
  $("drawer").classList.remove("open");
  $("overlay").classList.remove("open");
  $("drawer").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
$("openCart").addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeCart);
$("overlay").addEventListener("click", closeCart);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeCart(); });

// The hero button scrolls the user to the #products section rather than doing a full page refresh.
$("shopNow").addEventListener("click", () => {
  $("products").scrollIntoView({ behavior: "smooth" });
});

// Form feedback is shared across validation and submission states so the checkout form stays readable.
function setMsg(text, type) {
  const m = $("formMsg");
  m.textContent = text;
  m.className = "form-msg " + (type || "");
}

// Checkout validation happens before the email is sent so bad delivery details are caught early and the order is not submitted incomplete.
$("checkoutForm").addEventListener("submit", async e => {
  e.preventDefault();

  const name = $("custName").value.trim();
  const phone = $("custPhone").value.trim().replace(/[\s-]/g, "");
  const address = $("custAddress").value.trim();

  // Reset validation state before checking each delivery field again.
  ["custName", "custPhone", "custAddress"].forEach(id => $(id).classList.remove("invalid"));
  if (name.length < 2)              { $("custName").classList.add("invalid");    return setMsg("Enter your full name.", "error"); }
  if (!/^(\+91)?[6-9]\d{9}$/.test(phone)) { $("custPhone").classList.add("invalid");   return setMsg("Enter a valid 10-digit mobile number.", "error"); }
  if (address.length < 10)          { $("custAddress").classList.add("invalid"); return setMsg("Enter your full delivery address.", "error"); }
  if (cart.length === 0)            { return setMsg("Your cart is empty.", "error"); }

  // The order summary is flattened into a readable string so the EmailJS template can display the items clearly.
  const orderDetails = cart.map(i => {
    const p = findProduct(i.id);
    return `${p.name} - ${i.qty} x ${rupees(p.price)} = ${rupees(i.qty * p.price)}`;
  }).join("\n");

  // These keys must match the {{variables}} defined in the EmailJS template used by the store.
  const templateParams = {
    to_email: OWNER_EMAIL,
    customer_name: name,
    customer_phone: phone,
    customer_address: address,
    order_details: orderDetails,
    total_amount: rupees(cartTotal()),
    order_date: new Date().toLocaleString("en-IN")
  };

  const btn = $("placeOrder");
  btn.disabled = true;
  btn.textContent = "Placing order...";
  setMsg("");

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    setMsg("Order placed. The shop will call you to confirm.", "ok");
    cart = [];
    renderCart();
    $("checkoutForm").style.display = "grid";  // keep the success message visible while the customer sees the confirmation
    $("checkoutForm").reset();
    toast("Order sent to The Local Shop");
    setTimeout(() => { closeCart(); setMsg(""); $("checkoutForm").style.display = "none"; }, 2500);
  } catch (err) {
    console.error("EmailJS error:", err);
    setMsg("Order could not be sent. Check your connection and try again, or message us on WhatsApp.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Place order";
  }
});

// Startup code sets the footer year and renders the initial product and cart states on page load.
$("year").textContent = new Date().getFullYear();
renderProducts();
renderCart();