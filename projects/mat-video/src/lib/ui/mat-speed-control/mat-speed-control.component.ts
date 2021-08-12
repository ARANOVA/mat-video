import { Component, HostListener, Input } from '@angular/core';

@Component({
  selector: 'mat-speed-control',
  templateUrl: './mat-speed-control.component.html',
  styleUrls: ['./mat-speed-control.component.scss']
})
export class MatSpeedControlComponent {
  @Input() video: HTMLVideoElement;
  @Input() speedScale: number[] = [0.5, 0.75, 1, 1.25, 1.5, 2, 4, 8];
  @Input() speedIndex = 2;
  @Input() keyboard = true;

  constructor() { }

  speedControl(direction: number) {
    this.speedIndex += direction;
    if (this.speedIndex > this.speedScale.length - 1) {
      this.speedIndex = this.speedScale.length - 1;
    } else if (this.speedIndex < 0) {
      this.speedIndex = 0;
    } else {
      this.video.playbackRate = this.speed;
    }
  }

  get speed(): number {
    return this.speedScale[this.speedIndex];
  }

  @HostListener('document:keyup.+', ['$event'])
  onIncSpeedKey(event: KeyboardEvent) {
    if (this.keyboard) {
      this.speedControl(1);
      event.preventDefault();
    }
  }

  @HostListener('document:keyup.-', ['$event'])
  onDecSpeedKey(event: KeyboardEvent) {
    if (this.keyboard) {
      this.speedControl(-1);
      event.preventDefault();
    }
  }
}