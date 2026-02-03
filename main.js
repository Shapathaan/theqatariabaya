function navigate(id){
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

const db = firebase.firestore();

/* ADMIN LOGIN */
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

/* CART */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function toggleCart(){
  const drawer = document.getElementById("cart");
  drawer.classList.toggle("open");
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
  const itemsDiv = document.getElementById("cartItems");
  const emptyMsg = document.getElementById("emptyCartMsg");

  if(!itemsDiv) return;

  itemsDiv.innerHTML = "";

  if(cart.length === 0){
    emptyMsg.style.display = "block";
    return;
  }

  emptyMsg.style.display = "none";

  let total = 0;

  cart.forEach((item, i)=>{
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    itemsDiv.innerHTML += `
      <div style="
        border-bottom:1px solid #eee;
        padding:12px 0;
        display:flex;
        flex-direction:column;
        gap:6px;
      ">
        <div style="font-weight:700">${item.name}</div>

        <div style="font-size:13px;opacity:.7">
          Size: ${item.size}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:600">₹${itemTotal}</div>

          <div style="display:flex;gap:8px;align-items:center">
            <button onclick="changeQty(${i},-1)"
              style="width:28px;height:28px;border:none;border-radius:50%;
              background:#ddd;cursor:pointer">−</button>

            <span style="min-width:20px;text-align:center">${item.qty}</span>

            <button onclick="changeQty(${i},1)"
              style="width:28px;height:28px;border:none;border-radius:50%;
              background:#ddd;cursor:pointer">+</button>

            <button onclick="removeItem(${i})"
              style="border:none;background:none;color:#8A1538;
              font-weight:700;cursor:pointer">✕</button>
          </div>
        </div>
      </div>
    `;
  });

  itemsDiv.innerHTML += `
    <div style="
      margin-top:14px;
      padding-top:12px;
      border-top:2px solid #8A1538;
      font-weight:700;
      display:flex;
      justify-content:space-between;
    ">
      <span>Total</span>
      <span>₹${total}</span>
    </div>
  `;
}


function checkoutWhatsApp(){
  if(!cart.length) return alert("Cart empty");
  let msg="🖤 *THE QATARI ABAYA* 🖤\n\n";
  cart.forEach(i=>{
    msg+=`${i.name} (${i.size}) x${i.qty} = ₹${i.price*i.qty}\n`;
  });
  window.open(`https://wa.me/9172081816783?text=${encodeURIComponent(msg)}`);
}

/* PRODUCTS */
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

/* ADMIN CRUD */
function loadAdminProducts(){
  const old=document.getElementById("adminProducts");
  if(old) old.remove();
  const wrap=document.createElement("div");
  wrap.id="adminProducts";
  adminPanel.appendChild(wrap);

  db.collection("products").onSnapshot(s=>{
    wrap.innerHTML="<h3>Existing Products</h3>";
    s.forEach(d=>{
      const p=d.data();
      wrap.innerHTML+=`
        <div>
          ${p.name} – ₹${p.price}
          <button onclick="editProduct('${d.id}','${p.name}',${p.price},'${p.video}','${p.badge||""}')">Edit</button>
          <button onclick="db.collection('products').doc('${d.id}').delete()">Delete</button>
        </div>`;
    });
  });
}

function editProduct(id,n,p,v,b){
  pName.value=n;pPrice.value=p;pVideo.value=v;pBadge.value=b;
  uploadStatus.dataset.edit=id;
}

function uploadProduct(){
  const data={
    name:pName.value,
    price:+pPrice.value,
    video:pVideo.value,
    badge:pBadge.value,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  };
  const id=uploadStatus.dataset.edit;
  id?db.collection("products").doc(id).update(data)
    :db.collection("products").add(data);
  uploadStatus.innerText="Saved";
  uploadStatus.dataset.edit="";
  pName.value=pPrice.value=pVideo.value="";
}

/* VIDEO */
function openVideo(src){
  videoModal.style.display="flex";
  modalVideo.src=src;
}
function closeVideo(){
  modalVideo.pause();
  videoModal.style.display="none";
}

/* CLOUDINARY */
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
