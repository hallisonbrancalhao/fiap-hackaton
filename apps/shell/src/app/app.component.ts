import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Toast } from 'primeng/toast';

@Component({
	imports: [RouterModule, Toast],
	selector: 'app-root',
	template: `
		<p-toast position="top-right" />
		<router-outlet />
	`
})
export class AppComponent {}
