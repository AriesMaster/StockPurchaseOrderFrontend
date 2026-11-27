import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, timeout, Observable } from 'rxjs';
import { AuthStore } from '../../core/auth/services/auth.store';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { Breadcrumbs } from '../../shared/components/breadcrumbs/breadcrumbs';
import { ConfirmationDialog, ConfirmationData } from '../../shared/components/confirmation-dialog/confirmation-dialog';
import { SupplierService } from './services/supplier.service';
import { Supplier, SupplierPage } from './models/supplier.models';
@Component({
 selector:'app-supplier-directory',
 imports:[ReactiveFormsModule,MatDialogModule,PageHeader,Breadcrumbs],
 template:`
 <app-breadcrumbs [items]="[{label:'Workspace'},{label:'Suppliers'}]" />
 <app-page-header title="Suppliers" description="Manage supplier records and contact details." />
 @if(formOpen() && auth.role()==='ADMIN'){
 <section class="surface-card editor-card" aria-labelledby="supplier-editor-title">
 <form class="editor" [formGroup]="form" (ngSubmit)="save()" novalidate>
 <h2 id="supplier-editor-title">{{editing() ? 'Edit supplier' : 'Add supplier'}}</h2>
 <p class="muted">{{editing() ? 'Update supplier information and contact details.' : 'Enter the supplier information and contact details.'}}</p>
 @if(error()){<p class="feedback failure editor-feedback" role="alert">{{error()}}</p>}
 <div class="fields">
 <label>Supplier name (required)<input formControlName="name" maxlength="150" /></label>
 <label>Contact person<input formControlName="contactName" maxlength="150" /></label>
 <label>Email<input type="email" formControlName="email" maxlength="254" /></label>
 <label>Phone<input type="tel" formControlName="phone" maxlength="30" /></label>
 <label class="address">Address<textarea formControlName="address" maxlength="500" rows="2"></textarea></label>
 </div>
 @if(form.invalid && form.touched){<p role="alert">Enter a supplier name and valid contact details.</p>}
 <div class="controls"><button class="primary" type="submit" [disabled]="busy()">{{saving() ? 'Saving…' : 'Save supplier'}}</button><button type="button" [disabled]="busy()" (click)="formOpen.set(false)">Cancel</button></div>
 </form>
 </section>}
 <section class="surface-card directory">
 <div class="toolbar"><div><h2>Supplier directory</h2><p class="muted">Manage your purchasing contacts in one place.</p></div>@if(auth.role()==='ADMIN'){<button class="primary" [disabled]="busy() || formOpen()" (click)="openForm(null)">Add supplier</button>}</div>
 @if(notice()){<p class="feedback success" role="status">{{notice()}}</p>}
 @if(error() && !formOpen()){<p class="feedback failure" role="alert">{{error()}}</p>}
 <form class="toolbar search" (submit)="$event.preventDefault(); search()"><label>Search by name<input [formControl]="query" maxlength="150" placeholder="Search suppliers…" /></label><div class="controls"><button type="submit" [disabled]="busy()">Search</button><button type="button" [disabled]="busy()" (click)="query.reset(); search()">Clear</button><button type="button" [disabled]="busy()" (click)="load(page()?.number ?? 0)">Refresh</button></div></form>
 @if(loading()){<p role="status">Loading suppliers…</p>}
 @if(page(); as data){
 @if(data.content.length){<div class="table-scroll" tabindex="0"><table><thead><tr><th>Name</th><th>Contact details</th><th>Address</th><th>Status</th>@if(auth.role()==='ADMIN'){<th>Actions</th>}</tr></thead><tbody>
 @for(s of data.content; track s.id){<tr><td class="supplier-name">{{s.name}}</td><td><div class="contact"><strong>{{s.contactName || '—'}}</strong>@if(s.email){<span>{{s.email}}</span>}@if(s.phone){<span>{{s.phone}}</span>}</div></td><td>{{s.address || '—'}}</td><td><span class="status" [class.inactive]="!s.active">{{s.active?'Active':'Inactive'}}</span></td>@if(auth.role()==='ADMIN'){<td><div class="row-actions"><button [disabled]="busy()" (click)="openForm(s)">Edit</button><button [disabled]="busy() || formOpen()" (click)="requestStatus(s)">{{s.active?'Deactivate':'Reactivate'}}</button></div></td>}</tr>}
 </tbody></table></div>}@else{<div class="empty"><strong>No suppliers found</strong><p>Try another search or add a supplier.</p></div>}
 <div class="toolbar pagination"><span>{{data.totalElements}} {{data.totalElements === 1 ? 'supplier' : 'suppliers'}} · Page {{data.totalPages ? data.number+1 : 0}} of {{data.totalPages}}</span><div class="controls"><button [disabled]="busy() || data.number===0" (click)="load(data.number-1)">Previous</button><button [disabled]="busy() || data.number+1>=data.totalPages" (click)="load(data.number+1)">Next</button></div></div>}
 </section>`,
 styles:[`
 :host{display:block;min-width:0}
 .directory,.editor-card{margin-top:24px;padding:clamp(16px,2.2vw,28px);min-width:0}
 .toolbar,.controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
 .toolbar{justify-content:space-between;margin-bottom:20px}
 h2{font-size:1.1rem;margin:0}
 .muted{font-size:.85rem;color:#666;margin:5px 0 0}
 .editor{margin:0}.editor-feedback{margin-top:16px}.editor .controls{justify-content:flex-end}
 .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:16px 0}
 .address{grid-column:1/-1}
 label{display:flex;flex-direction:column;gap:6px;font-size:.85rem;font-weight:600;min-width:0}
 input,textarea{box-sizing:border-box;width:100%;padding:10px 12px;border:1px solid #bbb;border-radius:8px;background:white;color:#111;font:inherit;font-weight:400}
 input:focus,textarea:focus{outline:2px solid #333;outline-offset:2px}
 button{background:white;color:#111;border:1px solid #bbb;border-radius:8px;padding:8px 12px;cursor:pointer;font:inherit;font-size:.85rem;white-space:nowrap}
 button:hover:not(:disabled){background:#eee}button.primary{background:#111;color:white;border-color:#111}button.primary:hover:not(:disabled){background:#333}button:disabled{opacity:.45;cursor:default}
 .search{justify-content:flex-start;align-items:end;margin:0 0 20px}.search label{flex:1 1 220px;max-width:340px}
 .table-scroll{overflow-x:auto;max-width:100%;border:1px solid #e2e2e2;border-radius:10px}
 table{width:100%;border-collapse:collapse;text-align:left;font-size:.82rem;table-layout:auto}
 th,td{height:auto;padding:12px 10px;border-bottom:1px solid #e5e5e5;vertical-align:middle;white-space:normal;overflow-wrap:anywhere}
 th{background:#f6f6f6;font-weight:600}tbody tr:last-child td{border-bottom:0}tbody tr:hover{background:#fafafa}
 .supplier-name{font-weight:600;min-width:110px}.contact{display:grid;gap:3px;min-width:120px}.contact span{color:#555;font-size:.78rem}
 .row-actions{display:flex;flex-direction:column;align-items:stretch;gap:5px}.row-actions button{padding:5px 9px;font-size:.78rem}
 .status{display:inline-block;background:#e9f4eb;color:#235b32;padding:4px 9px;border-radius:20px;white-space:nowrap;font-size:.78rem}.status.inactive{background:#eee;color:#555}
 .pagination{margin:16px 0 0;font-size:.85rem;color:#555}
 .feedback{padding:12px 14px;border-radius:8px;margin:0 0 16px;font-size:.9rem}.success{background:#edf6ef;color:#235b32;border:1px solid #c6e0cc}.failure{background:#fff1f1;border:1px solid #e9c4c4}[role=alert]{color:#9b2222}
 .empty{text-align:center;padding:32px 12px;color:#555}.empty p{margin:6px 0 0;font-size:.85rem}
 @media(max-width:600px){.fields{grid-template-columns:1fr}.editor .controls{justify-content:flex-start}.search label{max-width:none}.table-scroll table{min-width:560px}}
 `]
})
export class SupplierDirectory {
 readonly auth=inject(AuthStore);
 private readonly api=inject(SupplierService);
 private readonly fb=inject(FormBuilder);
 private readonly destroy=inject(DestroyRef);
 private readonly dialog=inject(MatDialog);
 readonly page=signal<SupplierPage|null>(null);
 readonly loading=signal(false);
 readonly saving=signal(false);
 readonly error=signal('');
 readonly notice=signal('');
 readonly formOpen=signal(false);
 readonly editing=signal<Supplier|null>(null);
 readonly query=this.fb.nonNullable.control('',Validators.maxLength(150));
 private appliedSearch='';
 readonly form=this.fb.nonNullable.group({
 name:['',[Validators.required,Validators.maxLength(150),Validators.pattern(/.*\S.*/s)]],
 contactName:['',Validators.maxLength(150)],email:['',[Validators.email,Validators.maxLength(254)]],
 phone:['',Validators.maxLength(30)],address:['',Validators.maxLength(500)]
 });
 constructor(){this.load(0);}
 busy(){return this.loading() || this.saving();}
 search(){if(this.busy() || this.query.invalid)return;this.appliedSearch=this.query.value.trim();this.load(0);}
 load(number:number){
 if(this.loading() || number<0)return;
 this.loading.set(true);this.error.set('');
 this.api.list(number,20,this.appliedSearch).pipe(timeout(30000),takeUntilDestroyed(this.destroy),finalize(()=>this.loading.set(false))).subscribe({
 next:data=>this.page.set(data),error:()=>{this.page.set(null);this.error.set('Unable to load suppliers. Please retry.');}
 });
 }
 openForm(s:Supplier|null){
 if(this.auth.role()!=='ADMIN'||this.busy())return;
 this.editing.set(s);this.error.set('');this.notice.set('');
 this.form.reset({name:s?.name??'',contactName:s?.contactName??'',email:s?.email??'',phone:s?.phone??'',address:s?.address??''});
 this.formOpen.set(true);
 }
 save(){
 if(this.auth.role()!=='ADMIN'||this.busy()||!this.formOpen())return;
 this.form.markAllAsTouched();if(this.form.invalid)return;
 const raw=this.form.getRawValue();
 const request={name:raw.name.trim(),contactName:raw.contactName.trim(),email:raw.email.trim(),phone:raw.phone.trim(),address:raw.address.trim()};
 const s=this.editing();
 this.mutate(s?this.api.update(s.id,request):this.api.create(request),s?'Supplier updated.':'Supplier created.',true);
 }
 requestStatus(s:Supplier){
 if(this.auth.role()!=='ADMIN'||this.busy()||this.formOpen())return;
 const action=s.active?'Deactivate':'Reactivate';
 this.dialog.open<ConfirmationDialog,ConfirmationData,boolean>(ConfirmationDialog,{data:{title:action+' supplier?',description:action+' '+s.name+'? The supplier record will be retained.',confirmLabel:action},width:'440px',maxWidth:'92vw',autoFocus:'first-tabbable',restoreFocus:true}).afterClosed().pipe(takeUntilDestroyed(this.destroy)).subscribe(ok=>{
 if(ok===true && this.auth.role()==='ADMIN'&&!this.busy())this.mutate(this.api.changeStatus(s.id,!s.active),s.active?'Supplier deactivated.':'Supplier reactivated.',false);
 });
 }
 private mutate(request:Observable<Supplier>,message:string,close:boolean){
 this.saving.set(true);this.error.set('');this.notice.set('');
 request.pipe(timeout(30000),takeUntilDestroyed(this.destroy),finalize(()=>this.saving.set(false))).subscribe({
 next:()=>{if(close){this.formOpen.set(false);this.form.reset();}this.notice.set(message);this.load(close?0:this.page()?.number??0);},
 error:()=>this.error.set('Unable to confirm supplier change. Refresh before retrying.')
 });
 }
}
