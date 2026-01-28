import { Component } from '@angular/core';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-toolbar',
  imports: [
    ToolbarModule,
    ButtonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {

}
