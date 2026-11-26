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
 <section class="surface-card directory">
 <div class="toolbar"><h2>Supplier directory</h2>@if(auth.role()==='ADMIN'){<button class="primary" [disabled]="busy()" (click)="openForm(null)">Add supplier</button>}</div>
 @if(notice()){<p role="status">{{notice()}}</p>}
 @if(error()){<p role="alert">{{error()}}</p>}
 @if(formOpen() && auth.role()==='ADMIN'){
 <form [formGroup]="form" (ngSubmit)="save()" novalidate>
 <h2>{{editing() ? 'Edit supplier' : 'New supplier'}}</h2>
 <div class="fields">
 <label>Supplier name<input formControlName="name" maxlength="150" /></label>
 <label>Contact person<input formControlName="contactName" maxlength="150" /></label>
 <label>Email<input type="email" formControlName="email" maxlength="254" /></label>
 <label>Phone<input type="tel" formControlName="phone" maxlength="30" /></label>
 <label>Address<textarea formControlName="address" maxlength="500"></textarea></label>
 </div>
 @if(form.invalid && form.touched){<p role="alert">Enter a supplier name and valid contact details.</p>}
 <div class="controls"><button class="primary" type="submit" [disabled]="busy()">Save supplier</button><button type="button" [disabled]="busy()" (click)="formOpen.set(false)">Cancel</button></div>
 </form>}
 <form class="toolbar search" (ngSubmit)="search()"><label>Search by name<input [formControl]="query" maxlength="150" /></label><div class="controls"><button type="submit" [disabled]="busy()">Search</button><button type="button" [disabled]="busy()" (click)="query.reset(); search()">Clear</button><button type="button" [disabled]="busy()" (click)="load(page()?.number ?? 0)">Refresh</button></div></form>
 @if(loading()){<p role="status">Loading suppliers…</p>}
 @if(page(); as data){
 @if(data.content.length){<div class="table-scroll" tabindex="0"><table><thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Address</th><th>Status</th>@if(auth.role()==='ADMIN'){<th>Actions</th>}</tr></thead><tbody>
 @for(s of data.content; track s.id){<tr><td>{{s.name}}</td><td>{{s.contactName || '—'}}</td><td>{{s.email || '—'}}</td><td>{{s.phone || '—'}}</td><td>{{s.address || '—'}}</td><td><span class="status" [class.inactive]="!s.active">{{s.active?'Active':'Inactive'}}</span></td>@if(auth.role()==='ADMIN'){<td><div class="controls"><button [disabled]="busy()" (click)="openForm(s)">Edit</button><button [disabled]="busy() || formOpen()" (click)="requestStatus(s)">{{s.active?'Deactivate':'Reactivate'}}</button></div></td>}</tr>}
 </tbody></table></div>}@else{<p>No suppliers found.</p>}
 <div class="toolbar pagination"><span>{{data.totalElements}} suppliers · Page {{data.totalPages ? data.number+1 : 0}} of {{data.totalPages}}</span><div class="controls"><button [disabled]="busy() || data.number===0" (click)="load(data.number-1)">Previous</button><button [disabled]="busy() || data.number+1>=data.totalPages" (click)="load(data.number+1)">Next</button></div></div>}
 </section>`,
 styles:[`
 .directory{margin-top:24px;padding:clamp(16px,3vw,32px)} .toolbar,.controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.toolbar{justify-content:space-between;margin-bottom:16px}h2{font-size:1.1rem}.fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px;margin:16px 0}label{display:flex;flex-direction:column;gap:6px;font-size:.9rem;font-weight:600}input,textarea{width:100%;padding:10px;border:1px solid #aaa;border-radius:8px;background:white;color:#111}button{background:white;border:1px solid #aaa;border-radius:8px;padding:8px 12px;cursor:pointer}button.primary{background:#111;color:white}button:disabled{opacity:.5;cursor:default}.search{margin-top:24px;align-items:end}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:.875rem}th,td{padding:14px 12px;border-bottom:1px solid var(--border-color);white-space:nowrap}.status{background:#e9f4eb;color:#235b32;padding:4px 10px;border-radius:20px}.status.inactive{background:#eee;color:#555}.pagination{margin:20px 0 0}[role=alert]{color:#9b2222}
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
