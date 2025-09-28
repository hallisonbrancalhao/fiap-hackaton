import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'fiap-farms-farm',
  template: `<router-outlet></router-outlet>`,
  standalone: true,
  imports: [RouterModule],
})
export class FarmsComponent {}
