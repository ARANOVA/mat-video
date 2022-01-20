import { Component, EventEmitter, HostListener, Input, Output, Renderer2, SimpleChanges } from '@angular/core';

import { EventHandler } from '../../interfaces/event-handler.interface';
import { BaseUiComponent } from '../base/base.component';

@Component({
  selector: 'mat-play-button',
  templateUrl: './mat-play-button.component.html',
  styleUrls: ['./mat-play-button.component.scss']
})
export class MatPlayButtonComponent extends BaseUiComponent {

  @Input()
  get play() {
    return !this.video.paused;
  }

  set play(val: boolean) {
    if (val) {
      var playPromise = this.video.play();
      if (playPromise !== undefined) {
        playPromise.then(_ => {})
        .catch(error => {});
      }
    } else {
      this.video.pause();
    }
  }

  @Output() playChanged = new EventEmitter<boolean>();

  protected events: EventHandler[] = [
    /*{ element: null, name: 'play', callback: event => this.setVideoPlayback(true), dispose: null },
    { element: null, name: 'pause', callback: event => this.setVideoPlayback(false), dispose: null },
    { element: null, name: 'durationchange', callback: event => this.setVideoPlayback(false), dispose: null },
    { element: null, name: 'ended', callback: event => this.setVideoPlayback(false), dispose: null },
    { element: null, name: 'click', callback: event => this.toggleVideoPlayback(), dispose: null }
    */
  ]

  setVideoPlayback(value: boolean) {
    if (this.play !== value) {
      this.toggleVideoPlayback();
    }
  }

  toggleVideoPlayback(): void {
    this.play = !this.play;
    this.updateVideoPlayback();
  }

  updateVideoPlayback(): void {
    this.playChanged.emit(this.play);
  }

  @HostListener('document:keyup.space', ['$event'])
  onPlayKey(event: KeyboardEvent) {
    if (this.keyboard) {
      event.preventDefault();
      event.stopPropagation();
      this.toggleVideoPlayback();
      return false;
    }
  }
}
