import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';


@Component({
  selector: 'fiap-farms-list',
  template: `
    <p-table [value]="farms">
      <ng-template pTemplate="header">
        <tr>
          <th>Name</th>
          <th>City</th>
          <th>State</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-farm>
        <tr>
          <td>{{ farm.name }}</td>
          <td>{{ farm.city }}</td>
          <td>{{ farm.state }}</td>
        </tr>
      </ng-template>
    </p-table>
  `,
  standalone: true,
  imports: [TableModule],
})
export class FarmsListComponent {
  farms = [
    { name: 'Fazenda 1', city: 'Cidade 1', state: 'Estado 1' },
    { name: 'Fazenda 2', city: 'Cidade 2', state: 'Estado 2' },
  ];
}
