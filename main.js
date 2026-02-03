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
  const footer   = document.getElementById("cartFooter");
  const totalEl  = document.getElementById("cartTotal");

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
      <div class="cart-row"
        data-index="${index}"
        style="
          border-bottom:1px solid #eee;
          padding:12px 0;
          display:flex;
          flex-direction:column;
          gap:6px">

        <strong>${item.name}</strong>
        <small>Size: ${item.size}</small>

        <div style="display:flex;justify-content:space-between;align-items:center">
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

  totalEl.innerText = `₹${total}`;
  updateCartCount();
}

document.getElementById("cartItems").addEventListener("click", function(e){
  const btn = e.target;
  if(!btn.dataset.action) return;

  const row = btn.closest(".cart-row");
  const index = Number(row.dataset.index);

  if(btn.dataset.action === "inc"){
    cart[index].qty++;
  }

  if(btn.dataset.action === "dec"){
    cart[index].qty--;
    if(cart[index].qty <= 0) cart.splice(index,1);
  }

  if(btn.dataset.action === "remove"){
    cart.splice(index,1);
  }

  saveCart();
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

  let msg = `🖤 *THE QATARI ABAYA by Teepee's*\n`;
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
