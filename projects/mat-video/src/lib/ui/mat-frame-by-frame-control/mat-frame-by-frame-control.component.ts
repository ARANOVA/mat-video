import { Component, HostListener, Input } from '@angular/core';

@Component({
  selector: 'mat-frame-by-frame-control',
  templateUrl: './mat-frame-by-frame-control.component.html',
  styleUrls: ['./mat-frame-by-frame-control.component.scss']
})
export class MatFrameByFrameControlComponent {
  @Input() video: HTMLVideoElement;
  @Input() fps = 25;
  private _lastClick = 0;
  private _diffLimit = 350;
  private _interval: any;
  private _bigPrevJump = false;
  public mult = false;
  @Input() keyboard = true;

  constructor() {}

  seekFrames(nbFrames: number, absolute: boolean = false) {
    let difference: number = this._diffLimit;
    if (this._lastClick) {
      const endTime: number = (new Date()).getTime();
      difference = endTime - this._lastClick;
    }
    if (!absolute) {
      this.mult = true;
      this._lastClick = (new Date()).getTime();
    }
    if (this._interval) {
      clearInterval(this._interval);
    }
    this._interval = setTimeout(() => this.mult = false, this._diffLimit);
    
    if (!this.video.paused) {
      this.video.pause();
    }

    if (!absolute && difference < this._diffLimit) {
      nbFrames = nbFrames * this.fps - (this._bigPrevJump ? 0 : nbFrames);
      this._bigPrevJump = true;
    } else {
      this._bigPrevJump = false;
    }
    const currentFrames = this.video.currentTime * this.fps;
    const newPos = (currentFrames + nbFrames) / this.fps + 0.00001;
    // console.log("newPos", newPos)

    this.video.currentTime = newPos;
  }

  @HostListener('document:keyup.arrowleft', ['$event'])
  onRewKey(event: KeyboardEvent) {
    if (this.keyboard) {
      // console.log("onRewKey");
      this.seekFrames(-this.fps, true);
      event.preventDefault();
    }
  }

  @HostListener('document:keyup.arrowright', ['$event'])
  onFfKey(event: KeyboardEvent) {
    // console.log("onFfKey");
    if (this.keyboard) {
      this.seekFrames(this.fps, true);
      event.preventDefault();
    }
  }
}
