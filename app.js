const KEY="cashbook-pro-v2";
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("ar-EG",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const seed={books:[],transactions:[]};
let state=loadState(), transactionKind="in", draft={type:"شخصي",icon:"▤",color:"#287a63"};
function loadState(){try{return JSON.parse(localStorage.getItem(KEY))||seed}catch{return seed}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function id(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)}
function escapeHTML(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2300)}
function bookBalance(b){return Number(b.openingBalance||0)+state.transactions.filter(t=>t.bookId===b.id).reduce((s,t)=>s+(t.kind==="in"?1:-1)*Number(t.amount),0)}
function totals(){const visible=state.books.filter(b=>b.includeOverview!==false);const ids=new Set(visible.map(b=>b.id));const income=state.transactions.filter(t=>ids.has(t.bookId)&&t.kind==="in").reduce((s,t)=>s+t.amount,0);const expense=state.transactions.filter(t=>ids.has(t.bookId)&&t.kind==="out").reduce((s,t)=>s+t.amount,0);const opening=visible.reduce((s,b)=>s+Number(b.openingBalance||0),0);return{income,expense,balance:opening+income-expense}}
function render(){
 const t=totals();$("totalBalance").innerHTML=money(t.balance)+" <small>ج.م</small>";$("totalIncome").textContent=money(t.income);$("totalExpense").textContent=money(t.expense);
 $("booksList").innerHTML=state.books.length?state.books.map(b=>`<article class="book-card"><div class="book-icon" style="background:${b.color||"#287a63"}">${escapeHTML(b.icon||"▤")}</div><div class="book-name">${escapeHTML(b.name)}</div><div class="book-type-label">${escapeHTML(b.type||"شخصي")}</div><div class="book-balance">${money(bookBalance(b))} ج.م</div></article>`).join(""):'<div class="empty">لا توجد دفاتر. أنشئ أول دفتر للبدء.</div>';
 const list=[...state.transactions].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,10);
 $("transactionsList").innerHTML=list.map(x=>{const b=state.books.find(y=>y.id===x.bookId);return `<div class="transaction"><div class="tx-icon ${x.kind}">${x.kind==="in"?"↙":"↗"}</div><div class="tx-info"><b>${escapeHTML(x.description)}</b><small>${escapeHTML(b?.name||"دفتر")} · ${escapeHTML(x.category)} · ${escapeHTML(x.date)}</small></div><div class="tx-amount ${x.kind}">${x.kind==="in"?"+":"−"} ${money(x.amount)}</div></div>`}).join("");
 $("emptyState").hidden=list.length>0;
 $("transactionBook").innerHTML=state.books.map(b=>`<option value="${b.id}">${escapeHTML(b.name)}</option>`).join("");
}
function openBook(){draft={type:"شخصي",icon:"▤",color:"#287a63"};$("bookForm").reset();$("bookName").value="";$("openingBalance").value="0";$("monthlyBudget").value="";$("bookStartDate").value=today();$("includeOverview").checked=true;$("bookError").textContent="";setDraftUI();$("bookBackdrop").hidden=false}
function closeBook(){$("bookBackdrop").hidden=true}
function setDraftUI(){
 $("previewName").textContent=$("bookName").value.trim()||"دفتر جديد";$("previewMeta").textContent=draft.type+" · جنيه مصري";$("previewIcon").textContent=draft.icon;$("bookPreview").style.setProperty("--book-color",draft.color);
 document.querySelectorAll("[data-type]").forEach(x=>x.classList.toggle("selected",x.dataset.type===draft.type));
 document.querySelectorAll("[data-icon]").forEach(x=>x.classList.toggle("selected",x.dataset.icon===draft.icon));
 document.querySelectorAll("[data-color]").forEach(x=>x.classList.toggle("selected",x.dataset.color===draft.color));
}
$("newBookBtn").addEventListener("click",openBook);$("closeBook").addEventListener("click",closeBook);$("cancelBook").addEventListener("click",closeBook);
$("bookBackdrop").addEventListener("click",e=>{if(e.target===$("bookBackdrop"))closeBook()});
$("bookName").addEventListener("input",setDraftUI);
$("bookTypes").addEventListener("click",e=>{const b=e.target.closest("[data-type]");if(b){draft.type=b.dataset.type;setDraftUI()}});
$("bookIcons").addEventListener("click",e=>{const b=e.target.closest("[data-icon]");if(b){draft.icon=b.dataset.icon;setDraftUI()}});
$("bookColors").addEventListener("click",e=>{const b=e.target.closest("[data-color]");if(b){draft.color=b.dataset.color;setDraftUI()}});
$("bookForm").addEventListener("submit",e=>{
 e.preventDefault();const name=$("bookName").value.trim(),opening=Number($("openingBalance").value||0),budget=$("monthlyBudget").value===""?null:Number($("monthlyBudget").value);
 if(!name){$("bookError").textContent="اكتب اسم الدفتر.";return}
 if(!Number.isFinite(opening)){ $("bookError").textContent="الرصيد الافتتاحي غير صحيح.";return}
 if(budget!==null&&(!Number.isFinite(budget)||budget<0)){ $("bookError").textContent="الميزانية الشهرية غير صحيحة.";return}
 if(state.books.some(b=>b.name.toLowerCase()===name.toLowerCase())){$("bookError").textContent="يوجد دفتر بنفس الاسم بالفعل.";return}
 state.books.push({id:id(),name,type:draft.type,icon:draft.icon,color:draft.color,openingBalance:Math.round(opening*100)/100,startDate:$("bookStartDate").value||today(),monthlyBudget:budget,description:$("bookDescription").value.trim(),includeOverview:$("includeOverview").checked,createdAt:new Date().toISOString()});
 save();closeBook();toast("تم إنشاء الدفتر بنجاح");
});
function openTransaction(kind){if(!state.books.length){toast("أنشئ دفتراً أولاً");openBook();return}transactionKind=kind;document.querySelectorAll("[data-kind]").forEach(b=>b.classList.toggle("selected",b.dataset.kind===kind));$("transactionAmount").value="";$("transactionDescription").value="";$("transactionDate").value=today();$("transactionNotes").value="";$("transactionTitle").textContent=kind==="in"?"إضافة دخل":"إضافة مصروف";$("transactionBackdrop").hidden=false}
function closeTransaction(){$("transactionBackdrop").hidden=true}
$("addIncome").addEventListener("click",()=>openTransaction("in"));$("addExpense").addEventListener("click",()=>openTransaction("out"));
document.querySelectorAll("[data-kind]").forEach(b=>b.addEventListener("click",()=>{transactionKind=b.dataset.kind;document.querySelectorAll("[data-kind]").forEach(x=>x.classList.toggle("selected",x===b));$("transactionTitle").textContent=transactionKind==="in"?"إضافة دخل":"إضافة مصروف"}));
$("closeTransaction").addEventListener("click",closeTransaction);$("cancelTransaction").addEventListener("click",closeTransaction);$("transactionBackdrop").addEventListener("click",e=>{if(e.target===$("transactionBackdrop"))closeTransaction()});
$("transactionForm").addEventListener("submit",e=>{e.preventDefault();const amount=Number($("transactionAmount").value),description=$("transactionDescription").value.trim();if(!Number.isFinite(amount)||amount<=0||!description){toast("راجع المبلغ والبيان");return}state.transactions.push({id:id(),bookId:$("transactionBook").value,kind:transactionKind,amount:Math.round(amount*100)/100,description,category:$("transactionCategory").value,date:$("transactionDate").value,notes:$("transactionNotes").value.trim(),createdAt:new Date().toISOString()});save();closeTransaction();toast("تم حفظ الحركة")});
$("settingsBtn").addEventListener("click",()=>toast("الإعدادات ضمن المرحلة التالية"));$("showAllBtn").addEventListener("click",()=>toast("سجل الحركات الكامل قيد التطوير"));
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));if(b.dataset.tab!=="home")toast("قسم "+b.textContent.trim()+" قيد التطوير")}));
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
if(!state.books.length){state.books=[{id:id(),name:"دفتر المنزل",type:"المنزل",icon:"⌂",color:"#287a63",openingBalance:0,includeOverview:true,createdAt:new Date().toISOString()},{id:id(),name:"الدفتر الشخصي",type:"شخصي",icon:"♡",color:"#3976a8",openingBalance:0,includeOverview:true,createdAt:new Date().toISOString()}];localStorage.setItem(KEY,JSON.stringify(state))}
render();
