import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
	imports: [RouterOutlet],
	selector: 'app-map-entry',
	template: `<router-outlet />`
})
export class RemoteEntry {}
