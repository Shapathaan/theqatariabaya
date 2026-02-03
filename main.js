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
      loginStatus.innerText="Logged in";
      adminPanel.style.display="block";
      loadAdminProducts();
    })
    .catch(err=>loginStatus.innerText=err.message);
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
  renderCart();
}

function addToCart(id,name,price){
  const size=document.getElementById(`size-${id}`).value;
  if(!size) return alert("Select size");
  const item=cart.find(i=>i.id===id&&i.size===size);
  item?item.qty++:cart.push({id,name,price,size,qty:1});
  saveCart();
}

function updateCartCount(){
  const c=cart.reduce((s,i)=>s+i.qty,0);
  const badge=document.getElementById("cartCount");
  badge.style.display=c?"flex":"none";
  badge.innerText=c;
}

function renderCart(){
  const items=document.getElementById("cartItems");
  const empty=document.getElementById("emptyCartMsg");
  const footer=document.getElementById("cartFooter");

  items.innerHTML="";
  if(cart.length===0){
    empty.style.display="block";
    footer.style.display="none";
    return;
  }
  empty.style.display="none";
  footer.style.display="block";

  cart.forEach((i,idx)=>{
    items.innerHTML+=`
      <div>
        <b>${i.name}</b> (${i.size})<br>
        ₹${i.price*i.qty}
        <button onclick="cart[idx].qty++;saveCart()">+</button>
        <button onclick="cart[idx].qty--;if(cart[idx].qty<=0)cart.splice(idx,1);saveCart()">−</button>
      </div>`;
  });
}

/* ===== CHECKOUT ===== */
function checkoutWhatsApp(){
  let msg="NEW ORDER\n\n";
  cart.forEach(i=>{
    msg+=`${i.name} ${i.size} x${i.qty}\n`;
  });
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
            <option value="">Size</option>
            <option>S</option><option>M</option><option>L</option>
          </select>
          <button onclick="addToCart('${d.id}','${p.name}',${p.price})">Add</button>
        </div>
      </div>`;
  });
});

/* ===== ADMIN ===== */
function loadAdminProducts(){
  const wrap=document.getElementById("adminProducts");
  db.collection("products").orderBy("createdAt","desc").onSnapshot(s=>{
    wrap.innerHTML="<h4>Existing</h4>";
    s.forEach(d=>{
      const p=d.data();
      wrap.innerHTML+=`${p.name} ₹${p.price}
      <button onclick="db.collection('products').doc('${d.id}').delete()">Delete</button><br>`;
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
