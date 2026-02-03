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
  const size = sizeEl ? sizeEl.value : "";

  if(!size){
    alert("Please select a size");
    return;
  }

  const item = cart.find(i=>i.id===id && i.size===size);
  if(item){
    item.qty++;
  } else {
    cart.push({id,name,price,size,qty:1});
  }

  saveCart();
  toggleCart();
}

/* ================= CHANGE QTY ================= */
function changeQty(index, delta){
  cart[index].qty += delta;
  if(cart[index].qty <= 0){
    cart.splice(index,1);
  }
  saveCart();
}

/* ================= REMOVE ITEM ================= */
function removeItem(index){
  cart.splice(index,1);
  saveCart();
}

/* ================= CART COUNT ================= */
function updateCartCount(){
  const badge = document.getElementById("cartCount");
  if(!badge) return;

  const count = cart.reduce((s,i)=>s+i.qty,0);
  if(count > 0){
    badge.style.display="flex";
    badge.innerText = count;
  } else {
    badge.style.display="none";
  }
}

/* ================= RENDER CART ================= */
function renderCart(){
  const itemsDiv = document.getElementById("cartItems");
  const emptyMsg = document.getElementById("emptyCartMsg");
  if(!itemsDiv) return;

  itemsDiv.innerHTML = "";

  if(cart.length === 0){
    emptyMsg.style.display="block";
    return;
  }

  emptyMsg.style.display="none";

  cart.forEach((item,i)=>{
    itemsDiv.innerHTML += `
      <div style="margin-bottom:14px;border-bottom:1px solid #eee;padding-bottom:10px">
        <strong>${item.name}</strong><br>
        <small>Size: ${item.size}</small><br>
        ₹${item.price} × ${item.qty}
        <div style="margin-top:8px;display:flex;gap:6px">
          <button onclick="changeQty(${i},-1)">−</button>
          <button onclick="changeQty(${i},1)">+</button>
          <button onclick="removeItem(${i})">Remove</button>
        </div>
      </div>
    `;
  });
}

/* ================= WHATSAPP CHECKOUT ================= */
function checkoutWhatsApp(){
  if(cart.length === 0){
    alert("Your cart is empty");
    return;
  }

  let msg = `🖤 *The Qatari Abaya by Teepee's* 🖤\n\n📦 *New Order*\n\n`;
  let total = 0;

  cart.forEach((item,i)=>{
    total += item.price * item.qty;
    msg += `${i+1}. ${item.name}\n`;
    msg += `Size: ${item.size}\nQty: ${item.qty}\n₹${item.price * item.qty}\n\n`;
  });

  msg += `💰 *Total:* ₹${total}\n`;
  msg += `🕒 ${new Date().toLocaleString()}\n\nPlease confirm availability`;

  window.open(
    `https://wa.me/9172081816783?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
}

/* ================= LOAD PRODUCTS (SHOP) ================= */
db.collection("products")
.orderBy("createdAt","desc")
.onSnapshot(snap=>{
  const grid = document.getElementById("productGrid");
  if(!grid) return;

  grid.innerHTML = "";

  snap.forEach(doc=>{
    const p = doc.data();
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

          <select id="size-${doc.id}">
            <option value="">Select Size</option>
            <option>S</option><option>M</option>
            <option>L</option><option>XL</option><option>XXL</option>
          </select>

          <button onclick="addToCart('${doc.id}','${p.name}',${p.price})">
            Add to Cart
          </button>
        </div>
      </div>
    `;
  });
});

/* ================= ADMIN PRODUCTS ================= */
function loadAdminProducts(){
  const wrap = document.createElement("div");
  wrap.id = "adminProducts";
  wrap.innerHTML = "<h3>Existing Products</h3>";
  adminPanel.appendChild(wrap);

  db.collection("products")
    .orderBy("createdAt","desc")
    .onSnapshot(snap=>{
      wrap.innerHTML = "<h3>Existing Products</h3>";

      snap.forEach(doc=>{
        const p = doc.data();
        wrap.innerHTML += `
          <div style="margin:10px 0;border-bottom:1px solid #ddd;padding-bottom:8px">
            <strong>${p.name}</strong> — ₹${p.price}
            <div style="margin-top:6px">
              <button onclick="editProduct('${doc.id}','${p.name}',${p.price},'${p.video}','${p.badge||""}')">Edit</button>
              <button onclick="deleteProduct('${doc.id}')">Delete</button>
            </div>
          </div>
        `;
      });
    });
}

function editProduct(id,name,price,video,badge){
  pName.value = name;
  pPrice.value = price;
  pVideo.value = video;
  pBadge.value = badge;
  uploadStatus.innerText = "Editing product...";
  uploadStatus.dataset.editing = id;
}

function uploadProduct(){
  const data = {
    name: pName.value,
    price: Number(pPrice.value),
    video: pVideo.value,
    badge: pBadge.value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const editId = uploadStatus.dataset.editing;

  if(editId){
    db.collection("products").doc(editId).update(data);
    uploadStatus.innerText = "✅ Product updated";
    delete uploadStatus.dataset.editing;
  } else {
    db.collection("products").add(data);
    uploadStatus.innerText = "✅ Product added";
  }

  pName.value = pPrice.value = pVideo.value = "";
  pBadge.value = "";
}

function deleteProduct(id){
  if(confirm("Delete this product?")){
    db.collection("products").doc(id).delete();
  }
}

/* ================= VIDEO MODAL ================= */
function openVideo(src){
  videoModal.style.display="flex";
  modalVideo.src = src + "#t=0.1";
  modalVideo.load();
}
function closeVideo(){
  modalVideo.pause();
  modalVideo.src="";
  videoModal.style.display="none";
}

/* INIT */
updateCartCount();
renderCart();
