const db = firebase.firestore();

/* NAV */
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
    .then(()=>{
      loginStatus.innerText="✅ Logged in";
      adminPanel.innerHTML = `
        <button onclick="window.location='admin-orders.html'">
          Manage Orders
        </button>
      `;
      adminPanel.style.display="block";
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
  cartItems.innerHTML="";
  if(cart.length===0){
    emptyCartMsg.style.display="block";
    return;
  }
  emptyCartMsg.style.display="none";

  cart.forEach((item,i)=>{
    cartItems.innerHTML+=`
      <div style="margin-bottom:12px;border-bottom:1px solid #eee">
        <strong>${item.name}</strong><br>
        Size: ${item.size} | Qty: ${item.qty}<br>
        ₹${item.price * item.qty}
        <div>
          <button onclick="cart[${i}].qty++;saveCart()">+</button>
          <button onclick="cart[${i}].qty--;if(cart[${i}].qty<=0)cart.splice(${i},1);saveCart()">−</button>
        </div>
      </div>`;
  });
}

function checkoutWhatsApp(){
  if(cart.length===0){alert("Cart empty");return;}

  const order = {
    items: cart,
    total: cart.reduce((s,i)=>s+i.price*i.qty,0),
    status:"PLACED",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("orders").add(order).then(ref=>{
    let msg=`🖤 THE QATARI ABAYA 🖤\nOrder ID: ${ref.id}\n\n`;
    cart.forEach(i=>{
      msg+=`${i.name} (${i.size}) x${i.qty}\n`;
    });
    msg+=`\nTotal: ₹${order.total}`;
    window.open(`https://wa.me/9172081816783?text=${encodeURIComponent(msg)}`);
    cart=[];saveCart();
  });
}

/* PRODUCTS */
db.collection("products").orderBy("position","asc").onSnapshot(s=>{
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

/* VIDEO */
function openVideo(src){
  videoModal.style.display="flex";
  modalVideo.src=src;
}
function closeVideo(){
  modalVideo.pause();
  videoModal.style.display="none";
}

updateCartCount();
renderCart();
