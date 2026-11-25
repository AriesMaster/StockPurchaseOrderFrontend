import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';
export const routes: Routes = [{path:'',component:PublicLayout,children:[{path:'login',loadComponent:()=>import('./features/auth/login/login').then(m=>m.Login)},{path:'',loadComponent:()=>import('./features/home/home').then(m=>m.Home)}]},{path:'**',redirectTo:''}];