/* ================= NAV ================= */
function navigate(id){
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ================= FIREBASE ================= */
const db = firebase.firestore();

/* ================= ADMIN LOGIN ================= */
function loginAdmin(e){
  e.preventDefault();
  loginStatus.innerText = "Logging in...";

  firebase.auth()
    .signInWithEmailAndPassword(adminEmail.value, adminPassword.value)
    .then(()=>{
      loginStatus.innerText = "✅ Logged in";
      adminPanel.style.display = "block";
      loadAdminProducts();
    })
    .catch(err=>{
      loginStatus.innerText = "❌ " + err.message;
    });
}

/* ================= CART STATE ================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ================= CART TOGGLE ================= */
function toggleCart(){
  document.getElementById("cart").classList.toggle("open");
  renderCart();
}

/* ================= SAVE CART ================= */
function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

/* ================= ADD TO CART ================= */
function addToCart(id, name, price){
  const sizeEl = document.getElementById(`size-${id}`);
  if(!sizeEl || !sizeEl.value){
    alert("Please select size");
    return;
  }

  const size = sizeEl.value;
  const item = cart.find(i => i.id === id && i.size === size);

  if(item){
    item.qty++;
  } else {
    cart.push({ id, name, price, size, qty: 1 });
  }

  saveCart();
}

/* ================= CART COUNT ================= */
function updateCartCount(){
  const badge = document.getElementById("cartCount");
  if(!badge) return;

  const count = cart.reduce((s,i)=>s+i.qty,0);
  if(count > 0){
    badge.style.display = "flex";
    badge.innerText = count;
  } else {
    badge.style.display = "none";
  }
}

/* ================= RENDER CART ================= */
function renderCart(){
  const itemsDiv = document.getElementById("cartItems");
  const emptyMsg = document.getElementById("emptyCartMsg");
  const footer   = document.getElementById("cartFooter");
  const totalEl  = document.getElementById("cartTotal");

  if(!itemsDiv) return;

  itemsDiv.innerHTML = "";

  if(cart.length === 0){
    emptyMsg.style.display = "block";
    footer.style.display = "none";
    updateCartCount();
    return;
  }

  emptyMsg.style.display = "none";
  footer.style.display = "block";

  let total = 0;

  cart.forEach((item, index)=>{
    const line = item.price * item.qty;
    total += line;

    itemsDiv.innerHTML += `
      <div class="cart-row" data-index="${index}"
        style="border-bottom:1px solid #eee;padding:12px 0">
        <strong>${item.name}</strong><br>
        <small>Size: ${item.size}</small>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
          <span>₹${line}</span>
          <div style="display:flex;gap:8px;align-items:center">
            <button data-action="dec">−</button>
            <span>${item.qty}</span>
            <button data-action="inc">+</button>
            <button data-action="remove">✕</button>
          </div>
        </div>
      </div>
    `;
  });

  totalEl.innerText = "₹" + total;
  updateCartCount();
}

/* ================= CART EVENTS (IMPORTANT FIX) ================= */
document.addEventListener("click", function(e){
  if(!e.target.dataset.action) return;

  const row = e.target.closest(".cart-row");
  if(!row) return;

  const index = Number(row.dataset.index);

  if(e.target.dataset.action === "inc"){
    cart[index].qty++;
  }

  if(e.target.dataset.action === "dec"){
    cart[index].qty--;
    if(cart[index].qty <= 0) cart.splice(index,1);
  }

  if(e.target.dataset.action === "remove"){
    cart.splice(index,1);
  }

  saveCart();
});

/* ================= WHATSAPP CHECKOUT ================= */
function checkoutWhatsApp(){
  if(cart.length === 0){
    alert("Cart is empty");
    return;
  }

  const name = deliveryName.value.trim();
  const phone = deliveryPhone.value.trim();
  const address = deliveryAddress.value.trim();

  if(!name || !phone || !address){
    alert("Please fill delivery details");
    return;
  }

  let msg = `🖤 *THE QATARI ABAYA by Teepee's* 🖤\n`;
  msg += `━━━━━━━━━━━━━━\n`;
  msg += `📦 *New Order*\n\n`;

  let total = 0;

  cart.forEach((i,n)=>{
    const t = i.price * i.qty;
    total += t;
    msg += `${n+1}. ${i.name}\n`;
    msg += `Size: ${i.size} | Qty: ${i.qty}\n`;
    msg += `₹${t}\n\n`;
  });

  msg += `━━━━━━━━━━━━━━\n`;
  msg += `💰 Total: ₹${total}\n\n`;
  msg += `👤 Name: ${name}\n`;
  msg += `📞 Phone: ${phone}\n`;
  msg += `📍 Address: ${address}\n\n`;
  msg += `Please confirm availability 🙏`;

  window.open(
    `https://wa.me/9172081816783?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
}

/* ================= LOAD PRODUCTS ================= */
db.collection("products")
.orderBy("createdAt","desc")
.onSnapshot(snap=>{
  const grid = document.getElementById("productGrid");
  if(!grid) return;

  grid.innerHTML = "";

  snap.forEach(d=>{
    const p = d.data();
    const poster = p.video
      .replace("/upload/","/upload/so_0/")
      .replace(".mp4",".jpg");

    grid.innerHTML += `
      <div class="product-card">
        <img src="${poster}" class="product-thumb"
             onclick="openVideo('${p.video}')">
        <div class="product-info">
          <h4>${p.name}</h4>
          <p>₹${p.price}</p>

          <select id="size-${d.id}">
            <option value="">Select Size</option>
            <option>S</option><option>M</option>
            <option>L</option><option>XL</option>
          </select>

          <button onclick="addToCart('${d.id}','${p.name}',${p.price})">
            Add to Cart
          </button>
        </div>
      </div>
    `;
  });
});

/* ================= ADMIN CRUD ================= */
function loadAdminProducts(){
  const old = document.getElementById("adminProducts");
  if(old) old.remove();

  const wrap = document.createElement("div");
  wrap.id = "adminProducts";
  adminPanel.appendChild(wrap);

  db.collection("products").onSnapshot(snap=>{
    wrap.innerHTML = "<h3>Existing Products</h3>";

    snap.forEach(d=>{
      const p = d.data();
      wrap.innerHTML += `
        <div style="margin-bottom:8px">
          ${p.name} – ₹${p.price}
          <button onclick="editProduct('${d.id}','${p.name}',${p.price},'${p.video}','${p.badge||""}')">Edit</button>
          <button onclick="db.collection('products').doc('${d.id}').delete()">Delete</button>
        </div>
      `;
    });
  });
}

function editProduct(id,n,p,v,b){
  pName.value = n;
  pPrice.value = p;
  pVideo.value = v;
  pBadge.value = b;
  uploadStatus.dataset.edit = id;
}

function uploadProduct(){
  const data = {
    name: pName.value,
    price: Number(pPrice.value),
    video: pVideo.value,
    badge: pBadge.value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const id = uploadStatus.dataset.edit;
  if(id){
    db.collection("products").doc(id).update(data);
  } else {
    db.collection("products").add(data);
  }

  uploadStatus.innerText = "Saved";
  uploadStatus.dataset.edit = "";
  pName.value = pPrice.value = pVideo.value = "";
}

/* ================= VIDEO MODAL ================= */
function openVideo(src){
  videoModal.style.display = "flex";
  modalVideo.src = src + "#t=0.1";
  modalVideo.load();
}
function closeVideo(){
  modalVideo.pause();
  modalVideo.src = "";
  videoModal.style.display = "none";
}

/* ================= CLOUDINARY ================= */
function openCloudinary(){
  cloudinary.openUploadWidget({
    cloudName: "dsdvlwxa4",
    uploadPreset: "qatari-abaya",
    resourceType: "video",
    multiple: false
  }, (e,r)=>{
    if(!e && r.event === "success"){
      pVideo.value = r.info.secure_url;
    }
  });
}

/* ================= INIT ================= */
updateCartCount();
renderCart();
