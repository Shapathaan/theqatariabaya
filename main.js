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
  loginStatus.innerText="Logging in...";

  firebase.auth()
    .signInWithEmailAndPassword(adminEmail.value, adminPassword.value)
    .then(()=>{
      loginStatus.innerText="✅ Logged in";
      adminPanel.style.display="block";
    })
    .catch(err=>{
      loginStatus.innerText="❌ "+err.message;
    });
}

/* ================= UPLOAD PRODUCT ================= */
function uploadProduct(){
  const name  = pName.value.trim();
  const price = Number(pPrice.value);
  const video = pVideo.value.trim();
  const badge = pBadge.value;

  if(!name || !price || !video){
    uploadStatus.innerText="❌ Fill all fields";
    return;
  }

  uploadStatus.innerText="Uploading...";

  db.collection("products").add({
    name,
    price,
    video,
    badge,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(()=>{
    uploadStatus.innerText="✅ Product added";
    pName.value="";
    pPrice.value="";
    pVideo.value="";
    pBadge.value="";
  })
  .catch(err=>{
    uploadStatus.innerText="❌ "+err.message;
  });
}

/* ================= CART ================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function toggleCart(){
  document.getElementById("cart").classList.toggle("open");
  renderCart();
}

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function addToCart(id, name, price){
  const size = document.getElementById(`size-${id}`).value;
  if(!size){ alert("Select size"); return; }

  const item = cart.find(i=>i.id===id && i.size===size);
  if(item) item.qty++;
  else cart.push({id,name,price,size,qty:1});

  saveCart();
  toggleCart();
}

function changeQty(i,d){
  cart[i].qty+=d;
  if(cart[i].qty<=0) cart.splice(i,1);
  saveCart();
}

function removeItem(i){
  cart.splice(i,1);
  saveCart();
}

function renderCart(){
  const items=document.getElementById("cartItems");
  const totalEl=document.getElementById("cartTotal");
  const empty=document.getElementById("emptyCartMsg");
  const checkoutBtn=document.querySelector("#cart button");

  items.innerHTML="";
  let total=0;

  if(cart.length===0){
    empty.style.display="block";
    checkoutBtn.style.display="none";
    totalEl.innerText="0";
    return;
  }

  empty.style.display="none";
  checkoutBtn.style.display="block";

  cart.forEach((i,idx)=>{
    total+=i.price*i.qty;
    items.innerHTML+=`
      <div style="margin-bottom:12px">
        <b>${i.name}</b><br>
        Size: ${i.size}<br>
        ₹${i.price} × ${i.qty}
        <div>
          <button onclick="changeQty(${idx},-1)">−</button>
          <button onclick="changeQty(${idx},1)">+</button>
          <button onclick="removeItem(${idx})">Remove</button>
        </div>
      </div>
    `;
  });

  totalEl.innerText=total;
}

/* ================= LOAD PRODUCTS ================= */
db.collection("products")
.orderBy("createdAt","desc")
.onSnapshot(snap=>{
  const grid=document.getElementById("productGrid");
  if(!grid) return;

  grid.innerHTML="";

  snap.forEach(doc=>{
    const p=doc.data();
    const poster=p.video
      .replace("/upload/","/upload/so_0/")
      .replace(".mp4",".jpg");

    grid.innerHTML+=`
      <div class="product-card">
        <img src="${poster}" class="product-thumb"
             onclick="openVideo('${p.video}')">

        <div class="product-info">
          <h4>${p.name}</h4>
          <p>₹${p.price}</p>

          <select id="size-${doc.id}">
            <option value="">Size</option>
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

/* ================= VIDEO MODAL ================= */
function openVideo(src){
  videoModal.style.display="flex";
  modalVideo.src=src+"#t=0.1";
  modalVideo.load();
}
function closeVideo(){
  modalVideo.pause();
  modalVideo.src="";
  videoModal.style.display="none";
}

/* INIT */
renderCart();
