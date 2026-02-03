function navigate(id){
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

const db = firebase.firestore();

/* ===== ADMIN LOGIN ===== */
function loginAdmin(e){
  e.preventDefault();
  loginStatus.innerText="Logging in...";
  firebase.auth()
    .signInWithEmailAndPassword(adminEmail.value, adminPassword.value)
    .then(()=>{
      loginStatus.innerText="✅ Logged in";
      adminPanel.style.display="block";
      loadAdminProducts();
    })
    .catch(err=>loginStatus.innerText="❌ "+err.message);
}

/* ===== CART ===== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function toggleCart(){
  cart.classList.toggle("open");
  renderCart();
}

function saveCart(){
  localStorage.setItem("cart",JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function addToCart(id,name,price){
  const size=document.getElementById(`size-${id}`).value;
  if(!size){alert("Select size");return;}
  const item=cart.find(i=>i.id===id&&i.size===size);
  item?item.qty++:cart.push({id,name,price,size,qty:1});
  saveCart();
}

function updateCartCount(){
  const c=cart.reduce((s,i)=>s+i.qty,0);
  cartCount.style.display=c?"flex":"none";
  cartCount.innerText=c;
}

function renderCart(){
  cartItems.innerHTML="";
  if(cart.length===0){
    emptyCartMsg.style.display="block";
    return;
  }
  emptyCartMsg.style.display="none";
  cart.forEach((i,idx)=>{
    cartItems.innerHTML+=`
      <div>
        <b>${i.name}</b><br>
        Size: ${i.size} | Qty: ${i.qty}<br>
        ₹${i.price*i.qty}
        <div>
          <button onclick="i.qty++;saveCart()">+</button>
          <button onclick="i.qty--;if(i.qty<=0)cart.splice(${idx},1);saveCart()">−</button>
        </div>
      </div>`;
  });
}

/* ===== WHATSAPP ===== */
function checkoutWhatsApp(){
  if(cart.length===0){alert("Cart empty");return;}
  let msg="🖤 THE QATARI ABAYA 🖤\n\n";
  let total=0;
  cart.forEach(i=>{
    total+=i.price*i.qty;
    msg+=`${i.name} (${i.size}) x${i.qty}\n`;
  });
  msg+=`\nTotal: ₹${total}`;
  window.open(`https://wa.me/9172081816783?text=${encodeURIComponent(msg)}`);
}

/* ===== PRODUCTS ===== */
db.collection("products").orderBy("createdAt","desc").onSnapshot(s=>{
  productGrid.innerHTML="";
  s.forEach(d=>{
    const p=d.data();
    const poster=p.video.replace("/upload/","/upload/so_0/").replace(".mp4",".jpg");
    productGrid.innerHTML+=`
      <div class="product-card">
        <img src="${poster}" class="product-thumb" onclick="openVideo('${p.video}')">
        <div class="product-info">
          <h4>${p.name}</h4>
          <p>₹${p.price}</p>
          <select id="size-${d.id}">
            <option value="">Size</option><option>S</option><option>M</option><option>L</option>
          </select>
          <button onclick="addToCart('${d.id}','${p.name}',${p.price})">Add to Cart</button>
        </div>
      </div>`;
  });
});

/* ===== ADMIN CRUD ===== */
function loadAdminProducts(){
  const wrap=document.createElement("div");
  adminPanel.appendChild(wrap);
  db.collection("products").onSnapshot(s=>{
    wrap.innerHTML="<h3>Existing</h3>";
    s.forEach(d=>{
      const p=d.data();
      wrap.innerHTML+=`
        <div>${p.name} – ₹${p.price}
        <button onclick="db.collection('products').doc('${d.id}').delete()">Delete</button>
        </div>`;
    });
  });
}

/* ===== VIDEO ===== */
function openVideo(src){
  videoModal.style.display="flex";
  modalVideo.src=src;
}
function closeVideo(){
  modalVideo.pause();
  videoModal.style.display="none";
}

/* ===== CLOUDINARY ===== */
function openCloudinary(){
  cloudinary.openUploadWidget({
    cloudName:"dsdvlwxa4",
    uploadPreset:"qatari-abaya",
    resourceType:"video"
  },(e,r)=>{
    if(!e&&r.event==="success") pVideo.value=r.info.secure_url;
  });
}

updateCartCount();
renderCart();
