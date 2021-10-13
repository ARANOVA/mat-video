import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'mat-download-button',
  templateUrl: './mat-download-button.component.html',
  styles: ['a {color: inherit;text-decoration:none;}']
})
export class MatDownloadButtonComponent {
  @Input() video: HTMLVideoElement;
  @Input() title: string;

}
