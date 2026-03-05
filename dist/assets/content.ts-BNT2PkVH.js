(function(){const u="[BTA:content]",d=new WeakSet;function l(t){const a=t.querySelector('[data-testid="postText"]');if(a instanceof HTMLElement)return a.innerText;const n=t.cloneNode(!0);return n.querySelectorAll("[data-bta-wrapper]").forEach(e=>e.remove()),n.innerText||""}function c(t){if(d.has(t))return;d.add(t);const a=`
    display: inline-flex;
    align-items: center;
    margin: 4px 4px 4px 4px;
    padding: 4px 10px;
    background: #0085ff;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    z-index: 1;
  `,n=document.createElement("button");n.type="button",n.setAttribute("data-bta-play",""),n.textContent="▶ textareaを開く",n.style.cssText=a;const e=document.createElement("button");e.type="button",e.setAttribute("data-bta-log",""),e.textContent="📋 console.logに出力",e.style.cssText=a;const o=document.createElement("div");o.setAttribute("data-bta-row",""),o.style.cssText=`
    display: flex;
    align-items: center;
    margin: 4px 0;
  `,o.append(n,e);const r=document.createElement("textarea");r.setAttribute("data-bta-textarea",""),r.style.cssText=`
    display: none;
    width: 100%;
    box-sizing: border-box;
    margin: 4px 0;
    padding: 6px 8px;
    font-size: 13px;
    border: 1px solid #0085ff;
    border-radius: 4px;
    resize: vertical;
    min-height: 80px;
  `,n.addEventListener("click",i=>{i.stopPropagation(),r.style.display==="none"?(r.value||(r.value=l(t)),r.style.display="block"):r.style.display="none"}),e.addEventListener("click",i=>{i.stopPropagation(),r.value||(r.value=l(t)),console.log(u,r.value)});const s=document.createElement("div");s.setAttribute("data-bta-wrapper",""),s.append(o,r),t.prepend(s)}function p(){return document.querySelectorAll('[data-testid^="feedItem-"]')}function x(){p().forEach(t=>c(t))}function f(){x(),new MutationObserver(a=>{a.forEach(n=>{n.addedNodes.forEach(e=>{e instanceof HTMLElement&&(e.matches('[data-testid^="feedItem-"]')&&c(e),e.querySelectorAll&&e.querySelectorAll('[data-testid^="feedItem-"]').forEach(o=>c(o)))})})}).observe(document.body,{childList:!0,subtree:!0})}f();
})()
