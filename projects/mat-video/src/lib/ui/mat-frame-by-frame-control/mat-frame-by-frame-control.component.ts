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

  constructor() {}

  seekFrames(nbFrames: number) {
    let difference: number = 1000;
    if (this._lastClick) {
      const endTime: number = (new Date()).getTime();
      difference = endTime - this._lastClick;
    }
    this._lastClick = (new Date()).getTime();
    
    if (!this.video.paused) {
      this.video.pause();
    }

    if (difference < 1000) {
      nbFrames = nbFrames * 10;
    }

    const currentFrames = this.video.currentTime * this.fps;
    const newPos = (currentFrames + nbFrames) / this.fps + 0.00001;
    console.log("difference", difference, nbFrames, newPos);

    this.video.currentTime = newPos;
  }
}
