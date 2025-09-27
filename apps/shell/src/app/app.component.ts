import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';

@Component({
	imports: [RouterModule, Button],
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	public title = 'shell';
}
