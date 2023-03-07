import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mat-time-control',
  templateUrl: './mat-time-control.component.html',
  styles: ['.playtime{display:inline;font-size:12px;}']
})
export class MatTimeControlComponent {
  @Input() video: HTMLVideoElement;
}
