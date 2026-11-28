(() => {
"use strict";
const $=s=>document.querySelector(s);
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const money=n=>new Intl.NumberFormat("fa-IR").format(Number(n)||0)+" تومان";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const client=()=>window.nigaSupabase;
function subtotal(){
 const cart=read("niga-demo-cart",[]),products=read("niga-demo-products",[]);
 return cart.reduce((sum,item)=>{const p=products.find(x=>String(x.id)===String(item.id)&&x.active!==false);return sum+(p?Number(p.priceToman||0)*Math.max(1,Number(item.qty)||1):0)},0);
}
function feedback(message,ok=false){const el=$("#couponFeedback");if(el)el.textContent=message;const summary=$("#couponSummary");if(summary&&!ok)summary.textContent=""}
async function applyCoupon(){
 const input=$("#couponCode"),code=String(input?.value||"").trim().toUpperCase();
 if(!code){feedback("ابتدا کد تخفیف را وارد کن.");return}
 if(!client()||!read("niga-demo-current-user",null)){feedback("برای بررسی کد تخفیف ابتدا وارد حساب کاربری شو.");return}
 const btn=$("#applyCoupon");if(btn)btn.disabled=true;
 try{
  const {data,error}=await client().rpc("validate_coupon",{p_code:code,p_subtotal:subtotal()});
  if(error)throw error;
  write("niga-demo-applied-coupon",{code:data.code});
  feedback("کد تخفیف با موفقیت بررسی شد.",true);
  const summary=$("#couponSummary");
  if(summary)summary.textContent="میزان تخفیف: "+money(data.discount);
  document.dispatchEvent(new CustomEvent("niga:coupon-applied",{detail:data}));
 }catch(error){localStorage.removeItem("niga-demo-applied-coupon");feedback(error.message||"بررسی کد تخفیف انجام نشد.");}
 finally{if(btn)btn.disabled=false}
}
function normalizeDigits(value){
 return String(value||"").replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).trim();
}
function jalaliDateToGregorian(value){
 const normalized=normalizeDigits(value).replace(/[.\-]/g,"/");
 if(!normalized)return "";
 const match=normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
 if(!match)throw new Error("تاریخ را به شکل سال/ماه/روز وارد کن؛ مثلاً ۱۴۰۵/۰۹/۰۷.");
 const jy=Number(match[1]),jm=Number(match[2]),jd=Number(match[3]);
 if(jy<1300||jy>1500||jm<1||jm>12||jd<1||jd>(jm<=6?31:jm<=11?30:30))throw new Error("تاریخ شمسی معتبر نیست.");
 const calendar=new Intl.DateTimeFormat("en-US-u-ca-persian",{year:"numeric",month:"numeric",day:"numeric",timeZone:"UTC"});
 let start=null;
 for(let day=19;day<=22;day++){
  const candidate=new Date(Date.UTC(jy+621,2,day));
  const parts=Object.fromEntries(calendar.formatToParts(candidate).filter(p=>p.type!=="literal").map(p=>[p.type,Number(p.value)]));
  if(parts.year===jy&&parts.month===1&&parts.day===1){start=candidate;break;}
 }
 if(!start)throw new Error("تبدیل تاریخ انجام نشد؛ تاریخ را بررسی کن.");
 const offset=(jm<=6?(jm-1)*31:(6*31)+(jm-7)*30)+jd-1;
 start.setUTCDate(start.getUTCDate()+offset);
 const check=Object.fromEntries(calendar.formatToParts(start).filter(p=>p.type!=="literal").map(p=>[p.type,Number(p.value)]));
 if(check.year!==jy||check.month!==jm||check.day!==jd)throw new Error("این روز در تقویم شمسی معتبر نیست.");
 const gy=start.getUTCFullYear(),gm=String(start.getUTCMonth()+1).padStart(2,"0"),gd=String(start.getUTCDate()).padStart(2,"0");
 return gy+"-"+gm+"-"+gd;
}
function isAdmin(){return read("niga-demo-current-user",null)?.role==="ADMIN"}
function couponRow(c){
 const type=c.discount_type==="percent"?"٪":" تومان";
 const amount=c.discount_type==="percent"?esc(c.discount_value)+type:money(c.discount_value);
 const max=c.max_uses==null?"∞":Number(c.max_uses);
 const expiry=c.expires_at?new Intl.DateTimeFormat("fa-IR",{dateStyle:"medium"}).format(new Date(c.expires_at)):"بدون انقضا";
 return '<tr><td><b dir="ltr">'+esc(c.code)+'</b></td><td>'+amount+'</td><td>'+money(c.minimum_order)+'</td><td>'+Number(c.used_count||0)+' / '+max+'</td><td>'+expiry+'</td><td>'+(c.is_active?"فعال":"غیرفعال")+'</td><td class="admin-row-actions"><button type="button" data-coupon-toggle="'+esc(c.id)+'" data-active="'+String(c.is_active)+'">'+(c.is_active?"غیرفعال‌سازی":"فعال‌سازی")+'</button><button type="button" class="danger" data-coupon-delete="'+esc(c.id)+'">حذف</button></td></tr>';
}
async function renderAdminCoupons(){
 const target=$("#adminCouponList");if(!target)return;
 if(!isAdmin()||!client()){target.innerHTML='<p class="muted">برای مشاهده کدها وارد پنل مدیر شو.</p>';return}
 target.innerHTML='<p class="muted">در حال دریافت کدها از سرور...</p>';
 const {data,error}=await client().from("coupons").select("id,code,discount_type,discount_value,minimum_order,max_uses,used_count,expires_at,is_active").order("created_at",{ascending:false});
 if(error){target.innerHTML='<p class="muted">دریافت کدها ناموفق بود: '+esc(error.message)+'</p>';return}
 target.innerHTML=data?.length?'<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>کد</th><th>تخفیف</th><th>حداقل خرید</th><th>استفاده</th><th>انقضا</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>'+data.map(couponRow).join("")+'</tbody></table></div>':'<p class="muted">هنوز کد تخفیفی نساخته‌ای.</p>';
}
document.addEventListener("click",async e=>{
 if(e.target.closest("#applyCoupon")){await applyCoupon();return}
 const del=e.target.closest("[data-coupon-delete]");
 if(del){
  if(!isAdmin()||!client())return;
  del.disabled=true;
  const {error}=await client().from("coupons").delete().eq("id",del.dataset.couponDelete);
  if(error){feedback("حذف کد انجام نشد: "+error.message);del.disabled=false;return}
  await renderAdminCoupons();return;
 }
 const toggle=e.target.closest("[data-coupon-toggle]");
 if(toggle){
  if(!isAdmin()||!client())return;
  toggle.disabled=true;
  const {error}=await client().from("coupons").update({is_active:toggle.dataset.active!=="true"}).eq("id",toggle.dataset.couponToggle);
  if(error){feedback("تغییر وضعیت انجام نشد: "+error.message);toggle.disabled=false;return}
  await renderAdminCoupons();
 }
});
document.addEventListener("input",e=>{
 const input=e.target.closest('#couponAdminForm input[name="expiresAt"]');if(!input)return;
 const raw=String(input.value||"");
 const caretPos=input.selectionStart??raw.length;
 const digitsBefore=normalizeDigits(raw.slice(0,caretPos)).replace(/\D/g,"").length;
 const digits=normalizeDigits(raw).replace(/\D/g,"").slice(0,8);
 const formatted=digits.split("").map((d,i)=>d+(i===3||i===5?"/":"")).join("");
 const persian=formatted.replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
 input.value=persian;
 const caret=Math.min(persian.length,digitsBefore+(digitsBefore>=4?1:0)+(digitsBefore>=6?1:0));
 input.setSelectionRange(caret,caret);
 validateExpiryInput(input,false);
});
function validateExpiryInput(input,showIncomplete){
 const hint=$("#couponExpiryHint");
 const value=String(input.value||"").trim();
 let message="";
 if(value){
  if(!/^\d{4}\/\d{2}\/\d{2}$/.test(normalizeDigits(value))){
   if(showIncomplete)message="تاریخ را کامل و به شکل سال/ماه/روز وارد کن.";
  }else{
   try{jalaliDateToGregorian(value)}catch(error){message=error.message||"تاریخ شمسی معتبر نیست."}
  }
 }
 input.setCustomValidity(message);
 input.setAttribute("aria-invalid",message?"true":"false");
 input.classList.toggle("is-invalid",Boolean(message));
 if(hint){
  hint.textContent=message||"مثلاً ۱۴۰۵/۰۹/۰۷؛ خالی بگذاری یعنی بدون انقضا";
  hint.classList.toggle("is-error",Boolean(message));
 }
 return !message;
}
document.addEventListener("focusout",e=>{
 const input=e.target.closest('#couponAdminForm input[name="expiresAt"]');
 if(input)validateExpiryInput(input,true);
});
document.addEventListener("submit",async e=>{
 if(e.target.id!=="couponAdminForm")return;
 e.preventDefault();
 const form=e.target,feedbackEl=$("#couponAdminFeedback");
 if(!isAdmin()||!client()){feedbackEl.textContent="برای ساخت کد تخفیف باید مدیر وارد شده باشد.";return}
 const f=new FormData(form),code=String(f.get("code")||"").trim().toUpperCase(),type=String(f.get("type")),value=Number(f.get("value")),minOrder=Math.max(0,Number(f.get("minOrder"))||0),limit=Math.max(0,Number(f.get("usageLimit"))||0),expiry=String(f.get("expiresAt")||"").trim();
 if(!/^[A-Z0-9_-]{3,40}$/.test(code)||!Number.isFinite(value)||value<=0||(type==="percent"&&value>100)){feedbackEl.textContent="کد یا مقدار تخفیف معتبر نیست؛ درصد حداکثر ۱۰۰ است.";return}
 let expiryGregorian="";try{expiryGregorian=jalaliDateToGregorian(expiry)}catch(error){feedbackEl.textContent=error.message;return}
 const button=form.querySelector('button[type="submit"],button:not([type])');if(button)button.disabled=true;
 feedbackEl.textContent="در حال ذخیره کد در دیتابیس...";
 try{
  const payload={code,discount_type:type==="percent"?"percent":"fixed",discount_value:value,minimum_order:minOrder,max_uses:limit||null,used_count:0,expires_at:expiryGregorian?new Date(expiryGregorian+"T23:59:59").toISOString():null,is_active:true};
  const {error}=await client().from("coupons").insert(payload);
  if(error)throw error;
  form.reset();feedbackEl.textContent="کد تخفیف در سرور ذخیره شد.";await renderAdminCoupons();
 }catch(error){feedbackEl.textContent=error.message||"ذخیره کد انجام نشد."}
 finally{if(button)button.disabled=false}
});
const shell=$(".admin-shell");
if(shell)shell.addEventListener("click",e=>{if(e.target.closest('[data-admin-tab="coupons"]'))renderAdminCoupons()});
window.addEventListener("niga:auth-ready",renderAdminCoupons);
renderAdminCoupons();
})();