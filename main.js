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
    })
    .catch(err=>loginStatus.innerText="❌ "+err.message);
}

/* ===== CART ===== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function toggleCart(){
  document.getElementById("cart").classList.toggle("open");
  renderCart();
}

function saveCart(){
  localStorage.setItem("cart",JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount(){
  const badge=document.getElementById("cartCount");
  const c=cart.reduce((s,i)=>s+i.qty,0);
  badge.style.display=c?"flex":"none";
  badge.innerText=c;
}

function addToCart(id,name,price){
  const size=document.getElementById(`size-${id}`).value;
  if(!size){alert("Select size");return;}
  const item=cart.find(i=>i.id===id&&i.size===size);
  item?item.qty++:cart.push({id,name,price,size,qty:1});
  saveCart();
}

function renderCart(){
  const wrap=document.getElementById("cartItems");
  const empty=document.getElementById("emptyCartMsg");
  wrap.innerHTML="";
  if(cart.length===0){empty.style.display="block";return;}
  empty.style.display="none";

  cart.forEach((i,n)=>{
    wrap.innerHTML+=`
      <div style="border-bottom:1px solid #eee;padding:10px 0">
        <strong>${i.name}</strong><br>
        Size: ${i.size} | Qty: ${i.qty}<br>
        ₹${i.price*i.qty}
      </div>`;
  });
}

/* ===== PRODUCTS ===== */
db.collection("products").orderBy("createdAt","desc").onSnapshot(s=>{
  productGrid.innerHTML="";
  s.forEach(d=>{
    const p=d.data();
    const poster=p.video.replace("/upload/","/upload/so_0/").replace(".mp4",".jpg");
    productGrid.innerHTML+=`
      <div class="product-card">
        <img src="${poster}" class="product-thumb"
          onclick="openVideo('${p.video}')">
        <div class="product-info">
          <h4>${p.name}</h4>
          <p>₹${p.price}</p>
          <select id="size-${d.id}">
            <option value="">Size</option>
            <option>S</option><option>M</option>
            <option>L</option><option>XL</option>
          </select>
          <button onclick="addToCart('${d.id}','${p.name}',${p.price})">
            Add to Cart
          </button>
        </div>
      </div>`;
  });
});

/* ===== VIDEO ===== */
function openVideo(src){
  videoModal.style.display="flex";
  modalVideo.src=src;
}
function closeVideo(){
  modalVideo.pause();
  modalVideo.src="";
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
