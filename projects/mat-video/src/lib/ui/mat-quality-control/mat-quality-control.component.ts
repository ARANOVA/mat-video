import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mat-quality-control',
  templateUrl: './mat-quality-control.component.html',
  styles: ['.quality{display:inline-block;font-size:12px;padding-left:12px;padding-right:12px;}']
})
export class MatQualityControlComponent {
  @Input() video: HTMLVideoElement;
}
