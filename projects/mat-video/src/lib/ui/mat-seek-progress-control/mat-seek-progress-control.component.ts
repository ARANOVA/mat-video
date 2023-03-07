import { Component, Input } from '@angular/core';
import { ThemePalette } from '@angular/material/core';

import { EventHandler } from '../../interfaces/event-handler.interface';
import { BaseUiComponent } from '../base/base.component';

@Component({
  selector: 'app-mat-seek-progress-control',
  templateUrl: './mat-seek-progress-control.component.html',
  styleUrls: ['./mat-seek-progress-control.component.scss'],
})
export class MatSeekProgressControlComponent extends BaseUiComponent {
  curTimePercent = 0;
  bufTimePercent = 0;

  @Input() color: ThemePalette = 'primary';

  @Input() currentTime = 0;

  @Input() bufferedTime = 0;

  protected events: EventHandler[] = [
    { element: null, name: 'seeked', callback: () => this.updateCurrentTime(this.video.currentTime), dispose: null },
    { element: null, name: 'canplaythrough', callback: () => this.updateBufferedTime(), dispose: null },
    { element: null, name: 'timeupdate', callback: () => this.updateCurrentTime(this.video.currentTime), dispose: null },
    { element: null, name: 'progress', callback: () => this.updateBufferedTime(), dispose: null }
  ];

  seekVideo(value: number): void {
    const percentage = value / 100;
    const newTime = this.video.duration * percentage;
    this.video.currentTime = newTime;
  }

  updateCurrentTime(time: number): void {
    this.curTimePercent = (time / this.video.duration) * 100;
  }

  updateBufferedTime(): void {
    if (this.video.buffered.length > 0) {
      let largestBufferValue = 0;
      for (let i = 0; i < this.video.buffered.length; i++) {
        const cur = this.video.currentTime;
        const start = this.video.buffered.start(i);
        const end = this.video.buffered.end(i);
        if (start <= cur && end > cur && end - start > largestBufferValue) {
          largestBufferValue = end;
        }
      }
      this.bufferedTime = largestBufferValue;
      this.bufTimePercent = (this.bufferedTime / this.video.duration) * 100;
    }
  }

}
