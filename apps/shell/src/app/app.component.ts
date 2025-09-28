import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '@fiap-farm/ui-components';

@Component({
	imports: [RouterModule, HeaderComponent],
	selector: 'app-root',
	template: ` <ui-header /> <router-outlet /> `
})
export class AppComponent {}
