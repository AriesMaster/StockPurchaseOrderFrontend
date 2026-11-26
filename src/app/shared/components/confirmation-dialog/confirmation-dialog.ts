import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
export interface ConfirmationData { title:string; description:string; confirmLabel:string; }
@Component({
 selector:'app-confirmation-dialog',
 imports:[MatDialogModule,MatButtonModule],
 template:`<h2 mat-dialog-title>{{ data.title }}</h2><mat-dialog-content>{{ data.description }}</mat-dialog-content><mat-dialog-actions align="end"><button mat-button [mat-dialog-close]="false" cdkFocusInitial>Cancel</button><button mat-flat-button [mat-dialog-close]="true">{{ data.confirmLabel }}</button></mat-dialog-actions>`
})
export class ConfirmationDialog { readonly data=inject<ConfirmationData>(MAT_DIALOG_DATA); }
