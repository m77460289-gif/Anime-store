(() => {
"use strict";
const $=s=>document.querySelector(s);
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const money=n=>new Intl.NumberFormat("fa-IR").format(Number(n)||0)+" تومان";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function getSubtotal(){
 const cart=read("niga-demo-cart",[]),products=read("niga-demo-products",[]);
 return cart.reduce((sum,item)=>{const p=products.find(x=>Number(x.id)===Number(item.id)&&x.active!==false);return sum+(p?Number(p.priceToman||0)*Math.max(1,Number(item.qty)||1):0)},0);
}
function applyCoupon(){
 const input=$("#couponCode"),feedback=$("#couponFeedback"),summary=$("#couponSummary");
 if(!input||!feedback||!summary)return;
 const code=input.value.trim().toUpperCase(),list=read("niga-demo-coupons",[]),coupon=list.find(c=>String(c.code).toUpperCase()===code&&c.active!==false),subtotal=getSubtotal();
 const fail=msg=>{localStorage.removeItem("niga-demo-applied-coupon");feedback.textContent=msg;summary.textContent=""};
 if(!code){fail("ابتدا کد تخفیف را وارد کن.");return}
 if(!coupon){fail("این کد تخفیف معتبر یا فعال نیست.");return}
 if(coupon.expiresAt&&new Date(coupon.expiresAt+"T23:59:59")<new Date()){fail("مهلت استفاده از این کد تمام شده است.");return}
 if(Number(coupon.usageLimit)>0&&Number(coupon.usedCount||0)>=Number(coupon.usageLimit)){fail("ظرفیت استفاده از این کد تکمیل شده است.");return}
 if(subtotal<Number(coupon.minOrder||0)){fail("حداقل مبلغ خرید برای این کد رعایت نشده است.");return}
 const discount=Math.min(subtotal,coupon.type==="percent"?Math.floor(subtotal*Number(coupon.value)/100):Number(coupon.value)||0);
 if(discount<=0){fail("مبلغ تخفیف قابل اعمال نیست.");return}
 write("niga-demo-applied-coupon",{code:coupon.code});
 feedback.textContent="کد تخفیف با موفقیت اعمال شد.";
 summary.textContent="میزان تخفیف: "+money(discount);
}
function renderAdminCoupons(){
 const target=$("#adminCouponList");if(!target)return;
 const list=read("niga-demo-coupons",[]);
 if(!list.length){target.innerHTML='<p class="muted">هنوز کد تخفیفی نساخته‌ای.</p>';return}
 target.innerHTML='<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>کد</th><th>تخفیف</th><th>حداقل خرید</th><th>استفاده</th><th>انقضا</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>'+
 list.map(c=>'<tr><td><b dir="ltr">'+esc(c.code)+'</b></td><td>'+(c.type==="percent"?esc(c.value)+"٪":money(c.value))+'</td><td>'+money(c.minOrder||0)+'</td><td>'+Number(c.usedCount||0)+' / '+(Number(c.usageLimit)>0?Number(c.usageLimit):"∞")+'</td><td>'+esc(c.expiresAt||"بدون انقضا")+'</td><td>'+(c.active===false?"غیرفعال":"فعال")+'</td><td class="admin-row-actions"><button type="button" data-coupon-toggle="'+esc(c.code)+'">'+(c.active===false?"فعال‌سازی":"غیرفعال‌سازی")+'</button><button type="button" class="danger" data-coupon-delete="'+esc(c.code)+'">حذف</button></td></tr>').join("")+
 '</tbody></table></div>';
}
function addAdminTab(){
 const nav=$(".admin-tabs"),workspace=$(".admin-workspace");
 if(!nav||!workspace||$('[data-admin-tab="coupons"]'))return;
 const tab=document.createElement("button");tab.type="button";tab.className="admin-tab";tab.dataset.adminTab="coupons";tab.textContent="کدهای تخفیف";nav.appendChild(tab);
 const view=document.createElement("section");view.className="admin-view";view.dataset.adminView="coupons";
 view.innerHTML='<div class="admin-card admin-coupon-card"><h3>ساخت کد تخفیف</h3><form id="couponAdminForm" class="admin-coupon-form"><label>کد تخفیف<input name="code" required maxlength="40" placeholder="NIGA20"></label><label>نوع تخفیف<select name="type"><option value="percent">درصدی</option><option value="fixed">مبلغ ثابت (تومان)</option></select></label><label>مقدار تخفیف<input name="value" type="number" min="1" required></label><label>حداقل مبلغ خرید (تومان)<input name="minOrder" type="number" min="0" value="0"></label><label>سقف تعداد استفاده (۰ = نامحدود)<input name="usageLimit" type="number" min="0" value="0"></label><label>تاریخ انقضا<input name="expiresAt" type="date"></label><button class="button button-primary">ذخیره کد</button><p id="couponAdminFeedback" class="form-feedback"></p></form></div><div class="admin-card admin-list-card"><h3>کدهای ثبت‌شده</h3><div id="adminCouponList"></div></div>';
 workspace.appendChild(view);
}
document.addEventListener("click",e=>{
 if(e.target.closest("#applyCoupon")){applyCoupon();return}
 const del=e.target.closest("[data-coupon-delete]");
 if(del){if(localStorage.getItem("niga-demo-current-user")&&read("niga-demo-current-user",{}).role==="ADMIN"){write("niga-demo-coupons",read("niga-demo-coupons",[]).filter(c=>c.code!==del.dataset.couponDelete));renderAdminCoupons()}return}
 const toggle=e.target.closest("[data-coupon-toggle]");
 if(toggle){if(localStorage.getItem("niga-demo-current-user")&&read("niga-demo-current-user",{}).role==="ADMIN"){const list=read("niga-demo-coupons",[]),c=list.find(x=>x.code===toggle.dataset.couponToggle);if(c){c.active=c.active===false;write("niga-demo-coupons",list);renderAdminCoupons()}}}
});
document.addEventListener("submit",e=>{
 if(e.target.id!=="couponAdminForm")return;
 e.preventDefault();
 if(read("niga-demo-current-user",{}).role!=="ADMIN")return;
 const f=new FormData(e.target),code=String(f.get("code")).trim().toUpperCase(),type=String(f.get("type")),value=Number(f.get("value")),list=read("niga-demo-coupons",[]);
 const feedback=$("#couponAdminFeedback");
 if(!/^[A-Z0-9_-]{3,40}$/.test(code)||!Number.isFinite(value)||value<=0||(type==="percent"&&value>100)||list.some(c=>c.code===code)){feedback.textContent="کد تکراری یا مقدار نامعتبر است؛ درصد باید حداکثر ۱۰۰ باشد.";return}
 list.push({code,type,value,minOrder:Math.max(0,Number(f.get("minOrder"))||0),usageLimit:Math.max(0,Number(f.get("usageLimit"))||0),usedCount:0,expiresAt:String(f.get("expiresAt")||""),active:true});
 write("niga-demo-coupons",list);e.target.reset();feedback.textContent="کد تخفیف ذخیره شد.";renderAdminCoupons();
});
const observer=new MutationObserver(()=>{addAdminTab();renderAdminCoupons()});
const shell=$(".admin-shell");
if(shell)observer.observe(shell,{childList:true,subtree:true});
addAdminTab();renderAdminCoupons();
})();