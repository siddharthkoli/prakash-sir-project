import { Routes } from '@angular/router';
import { App } from './app';
import { FormComponent } from './form.component';
import { SuccessComponent } from './success.component';

export const routes: Routes = [
	{ path: '', component: FormComponent },
	{ path: 'success', component: SuccessComponent }
];
