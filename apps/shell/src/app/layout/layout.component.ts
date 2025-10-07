import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '@fiap-farm/ui-components';

@Component({
	selector: 'app-layout',
	imports: [RouterModule, HeaderComponent],
	template: `
		<ui-header />
		<router-outlet />
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {}
