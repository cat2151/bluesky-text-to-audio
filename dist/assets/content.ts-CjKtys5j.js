(function(){const s="[BTA:content]",a=new WeakSet;function i(t){const e=t.querySelector('[data-testid="postText"]');if(e instanceof HTMLElement)return e.innerText;const r=t.cloneNode(!0);return r.querySelectorAll("[data-bta-play]").forEach(n=>n.remove()),r.innerText||""}function o(t){if(a.has(t))return;a.add(t);const e=document.createElement("button");e.type="button",e.setAttribute("data-bta-play",""),e.textContent="▶ play",e.style.cssText=`
    display: inline-flex;
    align-items: center;
    margin: 4px 8px 4px 8px;
    padding: 4px 10px;
    background: #0085ff;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    z-index: 1;
  `,e.addEventListener("click",r=>{r.stopPropagation();const n=i(t);console.log(s,n)}),t.prepend(e)}function d(){return document.querySelectorAll('[data-testid^="feedItem-"]')}function l(){d().forEach(t=>o(t))}function u(){l(),new MutationObserver(e=>{e.forEach(r=>{r.addedNodes.forEach(n=>{n instanceof HTMLElement&&(n.matches('[data-testid^="feedItem-"]')&&o(n),n.querySelectorAll&&n.querySelectorAll('[data-testid^="feedItem-"]').forEach(c=>o(c)))})})}).observe(document.body,{childList:!0,subtree:!0})}u();
})()
