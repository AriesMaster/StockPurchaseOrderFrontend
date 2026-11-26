import { Component, input } from '@angular/core';
@Component({
 selector:'app-loading-state',
 template:`<div role="status" class="loading"><span class="spinner" aria-hidden="true"></span><span>{{ message() }}</span></div>`,
 styles:[`.loading{display:flex;align-items:center;justify-content:center;gap:12px;padding:24px;color:var(--secondary-text)}.spinner{width:22px;height:22px;border:3px solid #ddd;border-top-color:#222;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.spinner{animation:none}}`]
})
export class LoadingState { readonly message=input('Loading records…'); }
