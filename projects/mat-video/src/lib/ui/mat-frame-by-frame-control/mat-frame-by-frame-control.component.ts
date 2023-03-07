import { Component, HostListener } from '@angular/core';
import { BaseUiComponent } from '../base/base.component';

@Component({
  selector: 'app-mat-frame-by-frame-control',
  templateUrl: './mat-frame-by-frame-control.component.html',
})
export class MatFrameByFrameControlComponent extends BaseUiComponent {

  seekFrames(nbFrames: number) {
    if (!this.video.paused) {
      this.video.pause();
    }

    const currentFrames = this.video.currentTime * this.fps;
    const newPos = (currentFrames + nbFrames) / this.fps; // + 0.00001;
    this.video.currentTime = newPos;
  }

  @HostListener('document:keyup.arrowleft', ['$event'])
  onRewKey(event: KeyboardEvent) {
    if (this.keyboard) {
      this.seekFrames(-this.fps);
      event.preventDefault();
    }
  }

  @HostListener('document:keyup.arrowright', ['$event'])
  onFfKey(event: KeyboardEvent) {
    if (this.keyboard) {
      this.seekFrames(this.fps);
      event.preventDefault();
    }
  }
}
