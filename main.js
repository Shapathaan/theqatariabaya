/* NAVIGATION */
function navigate(id){
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ADMIN LOGIN */
function loginAdmin(e){
  e.preventDefault();
  loginStatus.innerText="Logging in...";
  firebase.auth()
    .signInWithEmailAndPassword(adminEmail.value, adminPassword.value)
    .then(()=>loginStatus.innerText="✅ Login successful")
    .catch(err=>loginStatus.innerText="❌ "+err.message);
}

/* CART STATE */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* CART UI */
function toggleCart(){
  document.getElementById("cart").classList.toggle("open");
}

/* SAVE CART */
function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

/* ADD TO CART */
function addToCart(id, name, price){
  const size = document.getElementById(`size-${id}`).value;
  if(!size){
    alert("Please select a size");
    return;
  }

  const existing = cart.find(i => i.id===id && i.size===size);
  if(existing){
    existing.qty += 1;
  } else {
    cart.push({id, name, price, size, qty:1});
  }

  saveCart();
  toggleCart();
}

/* REMOVE ITEM */
function removeItem(index){
  cart.splice(index,1);
  saveCart();
}

/* CHANGE QTY */
function changeQty(index, delta){
  cart[index].qty += delta;
  if(cart[index].qty <= 0) cart.splice(index,1);
  saveCart();
}

/* RENDER CART */
function renderCart(){
  const itemsDiv = document.getElementById("cartItems");
  const totalEl  = document.getElementById("cartTotal");

  if(!itemsDiv) return;

  itemsDiv.innerHTML="";
  let total = 0;

  cart.forEach((item,i)=>{
    total += item.price * item.qty;

    itemsDiv.innerHTML += `
      <div style="margin-bottom:12px">
        <strong>${item.name}</strong><br>
        Size: ${item.size}<br>
        ₹${item.price} × ${item.qty}
        <div>
          <button onclick="changeQty(${i},-1)">−</button>
          <button onclick="changeQty(${i},1)">+</button>
          <button onclick="removeItem(${i})">Remove</button>
        </div>
      </div>
    `;
  });

  totalEl.innerText = total;
}

/* FIRESTORE */
const db = firebase.firestore();

/* LOAD PRODUCTS */
db.collection("products")
.onSnapshot(snapshot=>{
  const grid=document.getElementById("productGrid");
  if(!grid) return;
  grid.innerHTML="";

  snapshot.forEach(doc=>{
    const p=doc.data();
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

          <select id="size-${doc.id}" style="width:100%;margin:6px 0">
            <option value="">Select Size</option>
            <option>S</option><option>M</option>
            <option>L</option><option>XL</option><option>XXL</option>
          </select>

          <button onclick="addToCart('${doc.id}','${p.name}',${p.price})"
            style="width:100%;padding:10px;background:#8A1538;color:#fff;
            border:none;border-radius:10px;cursor:pointer">
            Add to Cart
          </button>
        </div>
      </div>
    `;
  });
});

/* VIDEO MODAL */
function openVideo(src){
  const modal=document.getElementById("videoModal");
  const video=document.getElementById("modalVideo");
  modal.style.display="flex";
  video.src = src;
  video.load();
}

function closeVideo(){
  const modal=document.getElementById("videoModal");
  const video=document.getElementById("modalVideo");
  video.pause();
  video.src="";
  modal.style.display="none";
}

/* INIT */
renderCart();

/* HOME SLIDER (USES SAME PRODUCTS) */
db.collection("products").onSnapshot(snapshot=>{
  const track = document.getElementById("homeSliderTrack");
  if(!track) return;

  track.innerHTML = "";

  snapshot.forEach(doc=>{
    const p = doc.data();
    const poster = p.video
      .replace("/upload/","/upload/so_0/")
      .replace(".mp4",".jpg");

    track.innerHTML += `
      <div class="slider-card" onclick="navigate('products')">
        <img src="${poster}">
      </div>
    `;
  });

  // duplicate for smooth infinite scroll
  track.innerHTML += track.innerHTML;
});

