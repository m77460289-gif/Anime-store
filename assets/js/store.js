(() => {
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const pageParams=new URLSearchParams(location.search);
const isAdminPage=pageParams.get("admin")==="1"&&pageParams.get("store")!=="1";
const KEYS={users:"niga-demo-users",user:"niga-demo-current-user",products:"niga-demo-products",cart:"niga-demo-cart",orders:"niga-demo-orders",messages:"niga-demo-messages",favorites:"niga-demo-favorites",reviews:"niga-demo-reviews"};
const seed=[{"id":1,"name":"پوستر انیمه نیگا","description":"پوستر کلکسیونی از دنیای انیمه؛ مناسب اتاق و میز کار.","category":"پوستر انیمه","priceToman":280000,"stock":20,"imageUrl":"assets/images/product-poster-01.svg","active":true},{"id":2,"name":"قاب گوشی طرح انیمه","description":"قاب گوشی با طرح انیمه؛ انتخابی جذاب برای استفاده روزمره.","category":"اکسسوری موبایل","priceToman":550000,"stock":15,"imageUrl":"assets/images/product-phonecase-02.svg","active":true},{"id":3,"name":"پوستر کلکسیونی انیمه","description":"یک طرح هنری برای طرفداران انیمه و تزئین فضای شخصی.","category":"پوستر انیمه","priceToman":220000,"stock":18,"imageUrl":"assets/images/product-artprint-03.svg","active":true},{"id":4,"name":"استیکر پک انیمه","description":"مجموعه استیکرهای رنگی برای لپ‌تاپ، دفتر و وسایل شخصی.","category":"سایر","priceToman":95000,"stock":40,"imageUrl":"assets/images/product-stickers-04.svg","active":true},{"id":5,"name":"دفترچه یادداشت انیمه","description":"دفترچه جمع‌وجور برای یادداشت‌های روزانه و طراحی.","category":"سایر","priceToman":185000,"stock":25,"imageUrl":"assets/images/product-notebook-05.svg","active":true},{"id":6,"name":"پد موس طرح انیمه","description":"پد موس با طرح انیمه برای میز کار و گیمینگ.","category":"اکسسوری موبایل","priceToman":320000,"stock":12,"imageUrl":"assets/images/product-mousepad-06.svg","active":true},{"id":7,"name":"جاکلیدی کلکسیونی","description":"اکسسوری کوچک و دوست‌داشتنی برای کلید و کیف.","category":"سایر","priceToman":125000,"stock":30,"imageUrl":"assets/images/product-keychain-07.svg","active":true},{"id":8,"name":"تابلو دکوراتیو انیمه","description":"تابلوی تزئینی برای کامل‌کردن دکور اتاق طرفداران انیمه.","category":"پوستر انیمه","priceToman":490000,"stock":8,"imageUrl":"assets/images/product-frame-08.svg","active":true},{"id":9,"name":"کیف پارچه‌ای انیمه","description":"کیف سبک روزمره با حال‌وهوای دنیای انیمه.","category":"سایر","priceToman":390000,"stock":10,"imageUrl":"assets/images/product-tote-09.svg","active":true},{"id":10,"name":"ماگ طرح انیمه","description":"ماگ مناسب نوشیدنی‌های گرم و میز کار طرفداران انیمه.","category":"سایر","priceToman":280000,"stock":16,"imageUrl":"assets/images/product-mug-10.svg","active":true}];
const read=(key,fallback)=>{try{const x=JSON.parse(localStorage.getItem(key));return x==null?fallback:x}catch{return fallback}};
const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
let users=[],current=null,products=read(KEYS.products,seed),categories=read("niga-demo-categories",[]),cart=read(KEYS.cart,[]),orders=read(KEYS.orders,[]),messages=read(KEYS.messages,[]),favorites=read(KEYS.favorites,[]),reviews=read(KEYS.reviews,[]),category="all",authMode="login",authResolved=false;
if(!Array.isArray(products))products=[];
seed.forEach(item=>{if(!products.some(p=>String(p.id)===String(item.id)))products.push({...item})});
const imageRefresh={"1":"https://vograce.com/cdn/shop/files/Customposterssupportbanneranimeposterspropagandapostershandbannerposters1.jpg?v=1773256076&width=1080","2":"https://www.dreamnews.jp/press/0000302945/images/bodyimage2","3":"https://vograce.com/cdn/shop/files/Customposterssupportbanneranimeposterspropagandapostershandbannerposters2.jpg?v=1773256077&width=1000","4":"https://vograce.com/de/cdn/shop/products/StickerSampleBox720_5.jpg?v=1773238022&width=1080","5":"https://vograce.com/cdn/shop/products/custom-spiral-notebooks-vograce-1.jpg?v=1773236149&width=1080","6":"https://content.rozetka.com.ua/goods/images/big/407943808.jpg","7":"https://vograce.com/de/cdn/shop/files/CustomSyntheticWoodenKeychains8002601081.jpg?v=1773259036&width=1080","8":"https://vograce.com/cdn/shop/files/Customposterssupportbanneranimeposterspropagandapostershandbannerposters2.jpg?v=1773256077&width=1000","9":"https://vograce.com/cdn/shop/products/custom-canvas-tote-bags-vograce-1.jpg?v=1773235778&width=1080","10":"https://sw6.elbenwald.de/thumbnail/fc/dc/5d/1676418123/E1073882_6_1920x1920.jpg"};const previousLocalProductImages={"1":"assets/images/gojo-poster.webp","2":"assets/images/deku-phone.webp","3":"assets/images/images-1.webp","4":"assets/images/images-2.webp","5":"assets/images/images-3.webp","6":"assets/images/images-4.webp","7":"assets/images/images-5.webp","8":"assets/images/images-6.webp","9":"assets/images/images-7.webp","10":"assets/images/images-8.webp"};const localProductImages={"1":"assets/images/product-poster-01.svg","2":"assets/images/product-phonecase-02.svg","3":"assets/images/product-artprint-03.svg","4":"assets/images/product-stickers-04.svg","5":"assets/images/product-notebook-05.svg","6":"assets/images/product-mousepad-06.svg","7":"assets/images/product-keychain-07.svg","8":"assets/images/product-frame-08.svg","9":"assets/images/product-tote-09.svg","10":"assets/images/product-mug-10.svg"};products.forEach(p=>{const id=Number(p.id);if(localProductImages[id]&&(p.imageUrl===imageRefresh[id]||p.imageUrl===previousLocalProductImages[id]))p.imageUrl=localProductImages[id]});
const money=n=>new Intl.NumberFormat("fa-IR").format(Number(n)||0)+" تومان";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const persist=()=>{write(KEYS.products,products);write(KEYS.cart,cart);write(KEYS.orders,orders);write(KEYS.messages,messages);write(KEYS.favorites,favorites);write(KEYS.reviews,reviews);if(current)write(KEYS.user,{id:current.id,name:current.name,email:current.email,role:current.role});else localStorage.removeItem(KEYS.user)};
const toast=m=>{const el=$("#toast");el.textContent=m;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2500)};
function visible(){const q=$("#searchInput").value.trim().toLocaleLowerCase("fa");let list=products.filter(p=>p.active!==false&&(category==="all"||p.category===category||(category==="سایر"&&!["پوستر انیمه","اکسسوری موبایل"].includes(p.category)))&&(p.name+" "+p.description+" "+p.category).toLocaleLowerCase("fa").includes(q));const sort=$("#sortProducts").value;if(sort==="low")list.sort((a,b)=>(a.priceToman||0)-(b.priceToman||0));if(sort==="high")list.sort((a,b)=>(b.priceToman||0)-(a.priceToman||0));if(sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name,"fa"));return list}
function productCard(p,admin=false){
const price=Number(p.priceToman||0),compare=Number(p.compareAtPrice||0),hasDiscount=compare>price,discountPercent=hasDiscount?Math.round((1-price/compare)*100):0,ok=price>0&&(p.stock==null||p.stock>0),liked=favorites.map(id=>String(id)).includes(String(p.id)),productReviews=reviews.filter(r=>String(r.productId)===String(p.id)),avg=productReviews.length?productReviews.reduce((sum,r)=>sum+Number(r.rating||0),0)/productReviews.length:0;
const reviewText=productReviews.length?new Intl.NumberFormat("fa-IR",{maximumFractionDigits:1}).format(avg)+" از ۵ · "+new Intl.NumberFormat("fa-IR").format(productReviews.length)+" نظر":"هنوز نظری ثبت نشده";
return '<article class="product-card" data-product-card="' +p.id+ '" role="link" tabindex="0" aria-label="مشاهده جزئیات محصول '+esc(p.name)+'"><div class="product-image"><a class="product-image-link" href="product.html?id='+encodeURIComponent(p.id)+'"><img loading="lazy" src="'+esc(p.imageUrl||"assets/images/gojo-poster.webp")+'" alt="'+esc(p.name)+'" onerror="this.onerror=null;this.src=&quot;assets/images/product-poster-01.svg&quot;"></a><span class="product-tag">'+esc(p.category||"محصول نیگا")+'</span>'+(hasDiscount?'<span class="product-sale-badge">'+discountPercent+'٪ تخفیف</span>':"")+'<button type="button" class="favorite-toggle '+(liked?"is-favorite":"")+'" data-favorite="'+p.id+'" aria-label="'+(liked?"حذف از":"افزودن به")+' علاقه‌مندی‌ها" aria-pressed="'+liked+'">'+(liked?"♥":"♡")+'</button></div><div class="product-info"><h3><a class="product-title-link" href="product.html?id='+encodeURIComponent(p.id)+'">'+esc(p.name)+'</a></h3><p>'+esc(p.description||"محصول منتخب فروشگاه نیگا")+'</p><div class="product-meta"><span class="price">'+(price>0?(hasDiscount?'<del>'+money(compare)+'</del><strong>'+money(price)+'</strong>':money(price)):"<small>قیمت هنوز ثبت نشده</small>")+'</span><button class="add-button" data-add="'+p.id+'" '+(!ok?"disabled":"")+'>'+(ok?"افزودن به سبد":(price===0?"قیمت نامشخص":"ناموجود"))+'</button></div><details class="product-reviews"><summary><span class="review-stars">★</span> '+reviewText+' <span class="review-action">مشاهده / ثبت نظر</span></summary><div class="review-content">'+(productReviews.length?productReviews.slice().sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0)).map(r=>'<article class="customer-review"><div><b>'+esc(r.name||"مشتری نیگا")+'</b><span class="review-stars">'+("★".repeat(Math.max(0,Math.min(5,Number(r.rating)||0))))+'</span></div><p>'+esc(r.comment)+'</p></article>').join(""):'<p class="muted">اولین نفری باش که برای این محصول نظر می‌نویسد.</p>')+(current?'<form class="review-form" data-review-form="'+p.id+'"><label>امتیاز شما<select name="rating" required><option value="5">۵ ستاره - عالی</option><option value="4">۴ ستاره - خوب</option><option value="3">۳ ستاره - معمولی</option><option value="2">۲ ستاره - ضعیف</option><option value="1">۱ ستاره - خیلی ضعیف</option></select></label><label>نظر شما<textarea name="comment" rows="3" maxlength="700" required placeholder="تجربه‌ات از این محصول را بنویس..."></textarea></label><button class="button button-primary" type="submit">ثبت نظر</button><small class="form-feedback" data-review-feedback></small></form>':'<p class="muted">برای ثبت نظر ابتدا <button type="button" class="review-login" data-review-login>وارد حساب کاربری</button> شو.</p>')+'</div></details>'+(admin?'<div class="admin-product-actions"><button type="button" data-edit-product="'+p.id+'">ویرایش</button><button type="button" data-delete-product="'+p.id+'">حذف</button></div>':"")+'</div></article>';
}
function renderFavorites(){
favorites=favorites.map(id=>String(id)).filter((id,i,a)=>a.indexOf(id)===i&&products.some(p=>String(p.id)===id&&p.active!==false));
const list=favorites.map(id=>products.find(p=>String(p.id)===id)).filter(Boolean);
$("#favoriteGrid").innerHTML=list.length?list.map(p=>productCard(p)).join(""):'<p class="empty-products">هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌ای. روی قلب محصولات بزن تا اینجا ذخیره شوند.</p>';
$("#favoriteCount").textContent=new Intl.NumberFormat("fa-IR").format(favorites.length);
$("#favoriteTotal").textContent=new Intl.NumberFormat("fa-IR").format(favorites.length)+" محصول";
write(KEYS.favorites,favorites);
}
function renderProducts(){
const admin=isAdminPage&&current?.role==="ADMIN",list=visible();
$("#productGrid").innerHTML=list.length?list.map(p=>productCard(p,admin)).join(""):'<div class="empty-products">محصولی با این مشخصات پیدا نشد.</div>';
$("#productCount").textContent=new Intl.NumberFormat("fa-IR").format(products.filter(p=>p.active!==false).length)+" محصول";
$("#apiNote").textContent=window.nigaSupabase?"محصولات از پایگاه داده نیگا بارگذاری می‌شوند.":"اتصال پایگاه داده در دسترس نیست؛ فهرست ذخیره‌شده نمایش داده می‌شود.";
renderFavorites();
}
function cartProducts(){return cart.map(x=>{const p=products.find(y=>String(y.id)===String(x.id)&&y.active!==false);return p?{...p,qty:Math.max(1,Number(x.qty)||1)}:null}).filter(Boolean)}
function renderCart(){const list=cartProducts(),qty=list.reduce((n,p)=>n+p.qty,0),total=list.reduce((n,p)=>n+p.qty*p.priceToman,0);$("#cartCount").textContent=new Intl.NumberFormat("fa-IR").format(qty);$("#cartTotal").textContent=money(total);$("#cartItems").innerHTML=list.length?list.map(p=>'<div class="cart-line"><img src="'+esc(p.imageUrl)+'" alt=""><div><b>'+esc(p.name)+'</b><small>'+money(p.priceToman)+'</small><div class="qty-controls"><button data-qty="'+p.id+'" data-delta="-1">−</button><span>'+new Intl.NumberFormat("fa-IR").format(p.qty)+'</span><button data-qty="'+p.id+'" data-delta="1">+</button></div></div><button class="remove-item" data-remove="'+p.id+'">حذف</button></div>').join(""):'<p class="muted">سبد خریدت هنوز خالیه. از محصولات نیگا چیزی انتخاب کن.</p>';write(KEYS.cart,cart)}
function add(id){const p=products.find(x=>String(x.id)===String(id));if(!p)return;if(!p.priceToman){toast("قیمت این محصول هنوز ثبت نشده است.");return}if(p.stock!=null&&p.stock<=0){toast("این محصول فعلاً موجود نیست.");return}const item=cart.find(x=>x.id===p.id);if(item)item.qty++;else cart.push({id:p.id,qty:1});renderCart();toast("به سبد خرید اضافه شد.")}
function statusLabel(s){return ({PENDING:"در انتظار تأیید",PROCESSING:"در حال آماده‌سازی",SHIPPED:"ارسال شده",COMPLETED:"تکمیل شده",CANCELLED:"لغو شده"})[s]||s}
function renderMyOrders(){const list=orders.filter(o=>o.userEmail===current?.email).sort((a,b)=>b.id-a.id);$("#myOrders").innerHTML=list.length?list.map(o=>'<div class="order-card"><b>سفارش #'+o.id+'</b><small>'+statusLabel(o.status)+' · '+money(o.totalToman)+'</small></div>').join(""):'<p class="muted">هنوز سفارشی ثبت نکرده‌ای.</p>'}
function renderAdminOrders(){const box=$("#adminOrders");if(!box)return;const dateText=value=>{if(!value)return "تاریخ نامشخص";const date=new Date(value);return Number.isNaN(date.getTime())?"تاریخ نامشخص":new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium",timeStyle:"short"}).format(date)};box.innerHTML=orders.length?orders.slice().sort((a,b)=>b.id-a.id).map(o=>{const items=Array.isArray(o.items)?o.items:[];const itemHtml=items.length?items.map(item=>'<li><span>'+esc(item.name||"محصول")+' × '+new Intl.NumberFormat("fa-IR").format(Number(item.quantity)||1)+'</span><b>'+money((Number(item.priceToman)||0)*(Number(item.quantity)||1))+'</b></li>').join(""):'<li>جزئیات اقلام برای این سفارش ذخیره نشده است.</li>';return '<article class="admin-order"><div class="admin-order-heading"><b>سفارش #'+esc(o.id)+' · '+esc(o.customerName||"بدون نام")+'</b><time>'+dateText(o.createdAt)+'</time></div><div class="admin-order-contact"><span>تلفن: '+esc(o.phone||"ثبت نشده")+'</span><span>ایمیل: '+esc(o.userEmail||"ثبت نشده")+'</span></div><div class="admin-order-items"><strong>اقلام سفارش</strong><ul>'+itemHtml+'</ul></div><div class="admin-order-total">مبلغ کل: <b>'+money(o.totalToman)+'</b></div><div class="admin-order-address"><strong>نشانی تحویل</strong><p>'+esc(o.address||"ثبت نشده")+'</p></div>'+(o.note?'<div class="admin-order-note"><strong>توضیحات مشتری</strong><p>'+esc(o.note)+'</p></div>':"")+'<label class="admin-order-status">وضعیت سفارش<select data-order-status="'+esc(o.id)+'"><option value="PENDING" '+(o.status==="PENDING"?"selected":"")+'>در انتظار تأیید</option><option value="PROCESSING" '+(o.status==="PROCESSING"?"selected":"")+'>در حال آماده‌سازی</option><option value="SHIPPED" '+(o.status==="SHIPPED"?"selected":"")+'>ارسال شده</option><option value="COMPLETED" '+(o.status==="COMPLETED"?"selected":"")+'>تکمیل شده</option><option value="CANCELLED" '+(o.status==="CANCELLED"?"selected":"")+'>لغو شده</option></select></label></article>'}).join(""):'<p class="muted">هنوز سفارشی ثبت نشده است.</p>'}
function showAdmin(){const isAdmin=current?.role==="ADMIN";const panel=$("#adminSection");if(panel)panel.hidden=!(isAdmin&&isAdminPage);const nav=$("#adminNav");if(nav)nav.hidden=true;if(isAdminPage&&!authResolved)return;if(isAdminPage&&!isAdmin){if(panel)panel.hidden=true;return}if(isAdmin)renderAdminOrders();renderProducts()}
function syncAccount(){const yes=!!current;$("#authForm").hidden=yes;$("#switchAuth").hidden=yes;$("#accountContent").hidden=!yes;if(yes){$("#accountUser").innerHTML="<b>"+esc(current.name)+"</b><small>"+esc(current.email)+"</small>";renderMyOrders()}showAdmin()}
function openAccount(){$("#accountModal").showModal();syncAccount()}
function setMode(mode){authMode=mode;$("#authNameWrap").hidden=mode==="login";$("#authNameWrap").querySelector("input").required=mode==="register";$("#authTitle").textContent=mode==="login"?"ورود به حساب":"ساخت حساب جدید";$("#authSubmit").textContent=mode==="login"?"ورود":"ثبت‌نام";$("#switchAuth").textContent=mode==="login"?"حساب نداری؟ ثبت‌نام کن":"حساب داری؟ وارد شو";$("#authFeedback").textContent=""}
async function submitAuth(e){e.preventDefault();const client=window.nigaSupabase;if(!client){$("#authFeedback").textContent=window.nigaSupabaseError||"اتصال به سرور برقرار نشد.";return}const f=new FormData(e.currentTarget),email=String(f.get("email")).trim().toLowerCase(),password=String(f.get("password"));const button=$("#authSubmit");button.disabled=true;$("#authFeedback").textContent="در حال بررسی اطلاعات...";try{if(authMode==="register"){const name=String(f.get("name")).trim();if(name.length<2||password.length<8){$("#authFeedback").textContent="نام و رمز عبور حداقل ۸ کاراکتری لازم است.";return}const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:window.location.origin+window.location.pathname}});if(error)throw error;if(!data.session){$("#authFeedback").textContent="حساب ساخته شد. ایمیل تأیید را باز کن و لینک تازه را بزن؛ بعد از تأیید می‌توانی وارد شوی.";return}await setAuthenticatedUser(data.user);$("#authFeedback").textContent="";toast("حساب کاربری ساخته شد.");syncAccount();return}const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw error;await setAuthenticatedUser(data.user);$("#authFeedback").textContent="";toast("خوش آمدی "+current.name);syncAccount()}catch(error){$("#authFeedback").textContent=error.message==="Invalid login credentials"?"ایمیل یا رمز عبور درست نیست.":error.message||"ورود انجام نشد."}finally{button.disabled=false}}
async function deleteProduct(id){const client=window.nigaSupabase;if(!client||current?.role!=="ADMIN"){toast("دسترسی مدیر برای این عملیات لازم است.");return}if(!confirm("این محصول برای همیشه حذف شود؟ این کار قابل بازگشت نیست؛ سابقه سفارش‌ها حفظ می‌شود اما نظرهای این محصول حذف خواهند شد."))return;try{const {data,error}=await client.from("products").delete().eq("id",id).select("id").single();if(error)throw error;if(!data)throw new Error("محصول پیدا نشد یا اجازه حذف وجود ندارد.");cart=cart.filter(item=>String(item.id)!==String(id));favorites=favorites.filter(item=>String(item)!==String(id));persist();await loadCatalogFromSupabase();renderCart();toast("محصول به‌طور کامل حذف شد.")}catch(error){toast("حذف محصول انجام نشد: "+(error.message||"خطای سرور"));console.error("Delete product:",error)}}
async function toggleProductActive(id){const client=window.nigaSupabase;if(!client||current?.role!=="ADMIN"){toast("دسترسی مدیر برای این عملیات لازم است.");return}const product=products.find(item=>String(item.id)===String(id));if(!product)return;const nextActive=product.active===false;if(!nextActive&&!confirm("این محصول از فروشگاه غیرفعال شود؟"))return;try{const {error}=await client.from("products").update({is_active:nextActive}).eq("id",id);if(error)throw error;await loadCatalogFromSupabase();toast(nextActive?"محصول دوباره فعال شد.":"محصول غیرفعال شد؛ اطلاعاتش باقی می‌ماند.")}catch(error){toast("تغییر وضعیت محصول انجام نشد: "+(error.message||"خطای سرور"));console.error("Toggle product:",error)}}
function editProduct(id){const p=products.find(x=>String(x.id)===String(id));if(!p)return;const f=$("#productAdminForm");for(const key of ["id","name","category","stock","imageUrl","description"])f.elements[key].value=p[key]??"";f.elements.priceToman.value=p.compareAtPrice&&p.compareAtPrice>p.priceToman?p.compareAtPrice:p.priceToman;f.elements.discountPercent.value=p.compareAtPrice&&p.compareAtPrice>p.priceToman?Math.round((1-p.priceToman/p.compareAtPrice)*100):0;$("#adminProductFeedback").textContent="اطلاعات محصول برای ویرایش بارگذاری شد.";$("#adminSection").scrollIntoView({behavior:"smooth"})}
async function saveProduct(e){
 e.preventDefault();
 const client=window.nigaSupabase,feedback=$("#adminProductFeedback");
 if(!client||current?.role!=="ADMIN"){feedback.textContent="برای ذخیره محصول باید با حساب مدیر وارد شده باشی.";return}
 const form=e.currentTarget,f=new FormData(form),id=String(f.get("id")||"").trim(),name=String(f.get("name")||"").trim(),categoryName=String(f.get("category")||"").trim()||"اکسسوری و هدایا",basePrice=Number(f.get("priceToman")),discountPercent=Number(f.get("discountPercent")||0),price=Math.round(basePrice*(100-discountPercent)/100),stockValue=String(f.get("stock")??""),stock=stockValue===""?null:Number(stockValue),imageInput=String(f.get("imageUrl")||"").trim(),file=f.get("imageFile"),description=String(f.get("description")||"").trim();
 if(name.length<2||!Number.isFinite(basePrice)||basePrice<0||!Number.isInteger(discountPercent)||discountPercent<0||discountPercent>99||(stock!==null&&(!Number.isInteger(stock)||stock<0))){feedback.textContent="نام، قیمت یا موجودی محصول معتبر نیست.";return}
 const allowedTypes={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"};
 if(file&&file.size>0&&(!allowedTypes[file.type]||file.size>5*1024*1024)){feedback.textContent="تصویر باید JPG، PNG، WEBP یا AVIF و حداکثر ۵ مگابایت باشد.";return}
 const button=form.querySelector('button[type="submit"],button:not([type])');
 if(button)button.disabled=true;
 feedback.textContent="در حال ذخیره در پایگاه داده...";
 try{
  let categoryRow=categories.find(item=>String(item.name).trim().toLocaleLowerCase("fa")===categoryName.toLocaleLowerCase("fa"));
  if(!categoryRow){
   const {data,error}=await client.from("categories").insert({name:categoryName,slug:"category-"+crypto.randomUUID().slice(0,12),is_active:true,sort_order:categories.length+1}).select("id,name,slug,is_active,sort_order").single();
   if(error)throw error;
   categoryRow=data;categories.push(data);write("niga-demo-categories",categories);
  }
  const existing=products.find(item=>String(item.id)===id);
  let imageUrl=imageInput||existing?.imageUrl||"assets/images/product-poster-01.svg";
  if(file&&file.size>0){
   feedback.textContent="در حال بارگذاری تصویر محصول...";
   const filePath=current.id+"/"+crypto.randomUUID()+"."+allowedTypes[file.type];
   const {error:uploadError}=await client.storage.from("niga-products").upload(filePath,file,{cacheControl:"3600",upsert:false,contentType:file.type});
   if(uploadError)throw uploadError;
   const {data:publicData}=client.storage.from("niga-products").getPublicUrl(filePath);
   imageUrl=publicData.publicUrl;
  }
  const payload={category_id:categoryRow.id,name,slug:existing?.slug||("product-"+crypto.randomUUID().slice(0,12)),description,price,compare_at_price:discountPercent>0?basePrice:null,stock,image_url:imageUrl,is_active:existing?existing.active!==false:true,is_featured:existing?.featured===true};
  const result=id?await client.from("products").update(payload).eq("id",id).select("id").single():await client.from("products").insert(payload).select("id").single();
  if(result.error)throw result.error;
  await loadCatalogFromSupabase();
  form.reset();
  feedback.textContent="محصول با موفقیت در پایگاه داده ذخیره شد.";
  toast("محصول ذخیره شد.");
 }catch(error){
  feedback.textContent="ذخیره محصول انجام نشد: "+(error.message||"خطای ارتباط با سرور");
  console.error("Save product:",error);
 }finally{if(button)button.disabled=false}
}
async function checkout(e){
 e.preventDefault();
 const form=e.currentTarget;
 const feedback=$("#checkoutFeedback");
 if(!current){feedback.textContent="ابتدا وارد حساب کاربری شو.";return}
 const items=cartProducts();
 if(!items.length){feedback.textContent="سبد خرید خالی است.";return}
 if(items.some(p=>!p.priceToman)){feedback.textContent="قیمت یکی از محصولات مشخص نشده است.";return}
 const f=new FormData(form),customerName=String(f.get("fullName")||"").trim(),phone=String(f.get("phone")||"").trim(),address=String(f.get("address")||"").trim(),note=String(f.get("note")||"").trim();
 if(customerName.length<2||address.length<8||phone.replace(/[^0-9۰-۹]/g,"").length<8){feedback.textContent="نام، شماره تماس و نشانی معتبر وارد کن.";return}
 const client=window.nigaSupabase;
 if(!client){feedback.textContent="اتصال به پایگاه داده برقرار نیست.";return}
 const submit=form.querySelector('button[type="submit"]');
 if(submit)submit.disabled=true;
 feedback.textContent="در حال بررسی موجودی و ثبت امن سفارش...";
 try{
  const applied=read("niga-demo-applied-coupon",null);
  const {data,error}=await client.rpc("place_order",{
   p_items:items.map(item=>({product_id:item.id,quantity:item.qty})),
   p_customer_name:customerName,
   p_customer_phone:phone,
   p_shipping_address:{address},
   p_notes:note||null,
   p_coupon_code:applied?.code||null
  });
  if(error)throw error;
  const created=Array.isArray(data)?data[0]:data;
  if(!created?.order_number)throw new Error("پاسخ ثبت سفارش از سرور کامل نبود.");
  cart=[];
  localStorage.removeItem("niga-demo-applied-coupon");
  persist();
  feedback.textContent="سفارش #"+created.order_number+" با موفقیت در سرور ثبت شد.";
  toast("سفارش با موفقیت ثبت شد.");
  // A committed order must not be reported as failed because a later UI refresh fails.
  await Promise.allSettled([loadOrdersFromSupabase(),loadCatalogFromSupabase()]);
  renderCart();renderMyOrders();renderAdminOrders();
  setTimeout(()=>{
   const modal=$("#checkoutModal");
   if(modal?.open)modal.close();
   openAccount();
  },900);
 }catch(error){
  feedback.textContent=error.message||"ثبت سفارش انجام نشد.";
  console.error("Checkout:",error);
 }finally{if(submit)submit.disabled=false}
}
async function contact(e){
 e.preventDefault();
 const form=e.currentTarget,feedback=$("#contactFeedback"),f=new FormData(form),client=window.nigaSupabase;
 if(!current||!client){feedback.textContent="برای ارسال پیام ابتدا وارد حساب کاربری شو.";openAccount();return}
 const subject=String(f.get("subject")||"").trim(),message=String(f.get("message")||"").trim();
 if(subject.length<2||message.length<5){feedback.textContent="موضوع و متن پیام را کامل وارد کن.";return}
 const button=form.querySelector('button[type="submit"]');if(button)button.disabled=true;
 feedback.textContent="در حال ارسال پیام به پشتیبانی...";
 try{
  const {error}=await client.from("support_messages").insert({user_id:current.id,customer_name:current.name,customer_email:current.email,subject,message});
  if(error)throw error;
  feedback.textContent="پیامت با موفقیت برای پشتیبانی ارسال شد.";form.reset();
 }catch(error){feedback.textContent=error.message||"ارسال پیام انجام نشد."}
 finally{if(button)button.disabled=false}
}
document.addEventListener("submit",async e=>{
 const form=e.target.closest("[data-review-form]");if(!form)return;e.preventDefault();
 if(!current||!window.nigaSupabase){toast("برای ثبت نظر ابتدا وارد حساب شو.");openAccount();return}
 const productId=String(form.dataset.reviewForm),data=new FormData(form),comment=String(data.get("comment")||"").trim(),rating=Number(data.get("rating"));
 if(comment.length<3||comment.length>700||rating<1||rating>5){toast("متن نظر یا امتیاز معتبر نیست.");return}
 try{
  const {error}=await window.nigaSupabase.from("reviews").insert({product_id:productId,user_id:current.id,rating,comment,is_approved:false});
  if(error)throw error;
  toast("دیدگاهت ثبت شد و پس از تأیید مدیر نمایش داده می‌شود.");
 }catch(error){toast(error.message||"ثبت دیدگاه انجام نشد.")}
});
document.addEventListener("click",e=>{const login=e.target.closest("[data-review-login]");if(login){openAccount();return}const fav=e.target.closest("[data-favorite]");if(fav){const id=String(fav.dataset.favorite);favorites=favorites.map(String).includes(id)?favorites.filter(x=>String(x)!==id):[...favorites,id];renderProducts();toast(favorites.map(String).includes(id)?"به علاقه‌مندی‌ها اضافه شد.":"از علاقه‌مندی‌ها حذف شد.");return}const a=e.target.closest("[data-add]");if(a){add(a.dataset.add);return}const q=e.target.closest("[data-qty]");if(q){const id=String(q.dataset.qty),item=cart.find(x=>String(x.id)===id);if(item){item.qty+=Number(q.dataset.delta);if(item.qty<1)cart=cart.filter(x=>String(x.id)!==id);renderCart()}return}const r=e.target.closest("[data-remove]");if(r){cart=cart.filter(x=>String(x.id)!==String(r.dataset.remove));renderCart();return}const c=e.target.closest("[data-close]");if(c){$("#"+c.dataset.close).close();return}const edit=e.target.closest("[data-edit-product]");if(edit){editProduct(edit.dataset.editProduct);return}const del=e.target.closest("[data-delete-product]");if(del&&current?.role==="ADMIN"){deleteProduct(del.dataset.deleteProduct);return}const toggle=e.target.closest("[data-toggle-product]");if(toggle&&current?.role==="ADMIN"){toggleProductActive(toggle.dataset.toggleProduct)}});
document.addEventListener("click",e=>{const card=e.target.closest("[data-product-card]");if(!card||e.target.closest("button,a,input,textarea,select,summary,form,details"))return;location.href="product.html?id="+encodeURIComponent(card.dataset.productCard)});
document.addEventListener("keydown",e=>{const card=e.target.closest("[data-product-card]");if(card&&!e.target.closest("button,a,input,textarea,select,summary,form,details")&&(e.key==="Enter"||e.key===" ")){e.preventDefault();location.href="product.html?id="+encodeURIComponent(card.dataset.productCard)}});
document.addEventListener("change",async e=>{
 const select=e.target.closest("[data-order-status]");
 if(!select||current?.role!=="ADMIN")return;
 const order=orders.find(item=>String(item.id)===String(select.dataset.orderStatus));
 if(!order)return;
 const next=select.value,previous=order.status||"PENDING";
 if(previous===next)return;
 const statusMap={PENDING:"pending",PROCESSING:"processing",SHIPPED:"shipped",COMPLETED:"delivered",CANCELLED:"cancelled"};
 select.disabled=true;
 try{
  const {error}=await window.nigaSupabase.from("orders").update({status:statusMap[next]}).eq("id",order.uuid);
  if(error)throw error;
  await loadOrdersFromSupabase();
  toast("وضعیت سفارش در پایگاه داده به‌روزرسانی شد.");
 }catch(error){
  select.value=previous;
  toast("تغییر وضعیت انجام نشد: "+(error.message||"خطای سرور"));
 }finally{select.disabled=false}
});
$("#mobileMenu").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));$$("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("#mainNav").classList.remove("open")));
$("#cartOpen").addEventListener("click",()=>{$("#cartOverlay").classList.add("show");$("#cartOverlay").setAttribute("aria-hidden","false")});function closeCart(){$("#cartOverlay").classList.remove("show");$("#cartOverlay").setAttribute("aria-hidden","true")}$("#cartClose").addEventListener("click",closeCart);$("#cartOverlay").addEventListener("click",e=>{if(e.target.id==="cartOverlay")closeCart()});
$("#accountOpen").addEventListener("click",openAccount);$("#footerAccount").addEventListener("click",openAccount);$("#footerOrders").addEventListener("click",openAccount);$("#switchAuth").addEventListener("click",()=>setMode(authMode==="login"?"register":"login"));$("#authForm").addEventListener("submit",submitAuth);$("#contactForm").addEventListener("submit",contact);$("#checkoutForm").addEventListener("submit",checkout);$("#productAdminForm").addEventListener("submit",saveProduct);
$("#checkoutOpen").addEventListener("click",()=>{closeCart();if(!current){toast("برای ثبت سفارش ابتدا وارد حساب شو.");openAccount();return}if(!cart.length){toast("سبد خرید خالی است.");return}$("#checkoutModal").showModal()});
$("#logoutButton").addEventListener("click",async()=>{if(window.nigaSupabase)await window.nigaSupabase.auth.signOut();current=null;authResolved=true;persist();if(isAdminPage){if(window.parent!==window)window.parent.location.replace("index.html");else location.replace("index.html");return}syncAccount();toast("از حساب خارج شدی.")});
$("#searchInput").addEventListener("input",renderProducts);$("#sortProducts").addEventListener("change",renderProducts);$("#categoryFilters").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;category=b.dataset.category;$$(".filter-chip").forEach(x=>x.classList.toggle("active",x===b));renderProducts()});
async function loadOrdersFromSupabase(){
 const client=window.nigaSupabase;
 if(!client||!current)return;
 const {data,error}=await client.from("orders").select("id,order_number,user_id,status,payment_status,customer_name,customer_phone,shipping_address,subtotal,discount_amount,shipping_cost,total,notes,created_at,order_items(id,product_id,product_name,product_image,unit_price,quantity,line_total)").order("created_at",{ascending:false});
 if(error)throw error;
 orders=(data||[]).map(row=>({
  id:Number(row.order_number),uuid:row.id,userEmail:row.user_id===current.id?current.email:row.user_id,
  customerName:row.customer_name,phone:row.customer_phone,
  address:row.shipping_address?.address||"",note:row.notes||"",
  subtotalToman:Number(row.subtotal)||0,discountToman:Number(row.discount_amount)||0,
  totalToman:Number(row.total)||0,
  status:({pending:"PENDING",confirmed:"PROCESSING",processing:"PROCESSING",shipped:"SHIPPED",delivered:"COMPLETED",cancelled:"CANCELLED"})[row.status]||"PENDING",
  createdAt:row.created_at,
  items:(row.order_items||[]).map(item=>({productId:item.product_id,name:item.product_name,imageUrl:item.product_image,priceToman:Number(item.unit_price)||0,quantity:Number(item.quantity)||1}))
 }));
 write(KEYS.orders,orders);
 renderMyOrders();renderAdminOrders();
 window.dispatchEvent(new CustomEvent("niga:catalog-updated"));
}
async function setAuthenticatedUser(user){if(!user){current=null;persist();return}const {data:profile,error}=await window.nigaSupabase.from("profiles").select("id,full_name,role,phone").eq("id",user.id).single();if(error)throw error;current={id:user.id,name:profile.full_name||user.email.split("@")[0],email:user.email,role:profile.role==="admin"?"ADMIN":"CUSTOMER",phone:profile.phone||""};persist()}
function mapProductRow(row,categoryMap){return{id:row.id,slug:row.slug,categoryId:row.category_id||null,name:row.name,description:row.description||"",category:categoryMap.get(row.category_id)||"سایر",priceToman:Number(row.price)||0,compareAtPrice:row.compare_at_price==null?null:Number(row.compare_at_price),stock:row.stock,imageUrl:row.image_url||"assets/images/product-poster-01.svg",active:row.is_active!==false,featured:row.is_featured===true,createdAt:row.created_at}}
async function loadCatalogFromSupabase(){const client=window.nigaSupabase;if(!client)return;const [categoryResult,productResult]=await Promise.all([client.from("categories").select("id,name,slug,is_active,sort_order").order("sort_order",{ascending:true}),client.from("products").select("id,category_id,name,slug,description,price,compare_at_price,stock,image_url,is_active,is_featured,created_at").order("created_at",{ascending:false})]);if(categoryResult.error)throw categoryResult.error;if(productResult.error)throw productResult.error;const categoryRows=categoryResult.data||[],productRows=productResult.data||[];const categoryMap=new Map(categoryRows.map(item=>[item.id,item.name]));categories=categoryRows;write("niga-demo-categories",categories);products=productRows.map(row=>mapProductRow(row,categoryMap));write(KEYS.products,products);const filters=$("#categoryFilters");if(filters){filters.innerHTML='<button class="filter-chip active" data-category="all">همه</button>'+(categories.filter(item=>item.is_active!==false).map(item=>'<button class="filter-chip" data-category="'+esc(item.name)+'">'+esc(item.name)+'</button>').join(""))}renderProducts();window.dispatchEvent(new CustomEvent("niga:catalog-updated"))}
window.nigaReloadCatalog=loadCatalogFromSupabase;
async function initializeAuth(){const client=window.nigaSupabase;if(!client){authResolved=true;$("#apiNote").textContent=window.nigaSupabaseError||"اتصال به پایگاه داده در دسترس نیست.";syncAccount();return}const catalogTask=loadCatalogFromSupabase().catch(error=>{console.error("Catalog load failed:",error);$("#apiNote").textContent="بارگذاری محصولات ناموفق بود: "+(error.message||"خطای ارتباط")});try{const {data,error}=await client.auth.getSession();if(error)throw error;if(data.session?.user)await setAuthenticatedUser(data.session.user);else{current=null;persist()}}catch(error){console.error("Auth initialization:",error);current=null}authResolved=true;syncAccount();if(current){try{await loadOrdersFromSupabase()}catch(error){console.error("Orders load failed:",error)}}await catalogTask}
persist();setMode("login");renderProducts();renderCart();initializeAuth();
})();