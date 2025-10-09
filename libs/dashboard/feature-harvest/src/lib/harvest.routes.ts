import { Routes } from '@angular/router';
import { HarvestListComponent } from './harvest-list/harvest-list.component';
import { HarvestFormComponent } from './harvest-form/harvest-form.component';

export const harvestRoutes: Routes = [
  {
    path: '',
    component: HarvestListComponent,
  },
  {
    path: 'new',
    component: HarvestFormComponent,
  },
];
