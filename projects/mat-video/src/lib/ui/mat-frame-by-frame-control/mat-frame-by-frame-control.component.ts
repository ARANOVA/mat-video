import { Component, Input, OnInit } from "@angular/core";

@Component({
  selector: "mat-frame-by-frame-control",
  templateUrl: "./mat-frame-by-frame-control.component.html",
  styleUrls: ["./mat-frame-by-frame-control.component.scss"]
})
export class MatFrameByFrameControlComponent {
  @Input() video: HTMLVideoElement;
  @Input() fps = 25;
  private _lastClick: number = 0;
  private _diffLimit = 350;
  private _interval: any;
  private _bigPrevJump = false;
  public mult = false;

  constructor() {}

  seekFrames(nbFrames: number) {
    let difference: number = this._diffLimit;
    this.mult = true;
    if (this._lastClick) {
      const endTime: number = (new Date()).getTime();
      difference = endTime - this._lastClick;
    }
    this._lastClick = (new Date()).getTime();
    if (this._interval) {
      clearInterval(this._interval);
    }
    this._interval = setTimeout(() => this.mult = false, this._diffLimit);
    
    if (!this.video.paused) {
      this.video.pause();
    }

    if (difference < this._diffLimit) {
      nbFrames = nbFrames * this.fps - (this._bigPrevJump ? 0 : nbFrames);
      this._bigPrevJump = true;
    } else {
      this._bigPrevJump = false;
    }
    const currentFrames = this.video.currentTime * this.fps;
    const newPos = (currentFrames + nbFrames) / this.fps + 0.00001;

    this.video.currentTime = newPos;
  }
}
