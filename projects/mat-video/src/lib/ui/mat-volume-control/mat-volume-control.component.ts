import { AfterViewInit, Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ThemePalette } from '@angular/material/core';

import { BaseUiComponent } from '../base/base.component';

@Component({
  selector: 'app-mat-volume-control',
  templateUrl: './mat-volume-control.component.html',
  styleUrls: ['./mat-volume-control.component.scss']
})
export class MatVolumeControlComponent extends BaseUiComponent implements AfterViewInit, OnChanges {

  curVolumePercent = 0;

  @Input() color: ThemePalette = 'primary';

  @Input() volume = 1;

  @Output() volumeChanged = new EventEmitter<number>();

  @Input() muted = false;

  @Output() mutedChanged = new EventEmitter<boolean>();

  ngAfterViewInit(): void {
    this.updateMuted(false);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.muted) {
      this.updateMuted(false);
    }
  }

  setVolume(): void {
    this.volume = this.curVolumePercent;
    this.video.volume = this.volume;
    this.volumeChanged.emit(this.volume);

    if (this.volume > 0) {
      this.setMuted(false);
    }
  }

  setMuted(value: boolean): void {
    if (this.muted !== value) {
      this.toggleMuted();
    }
  }

  toggleMuted(): void {
    this.muted = !this.muted;
    this.updateMuted();
  }

  updateMuted(emitChange = true): void {
    if (this.video) {
      this.video.muted = this.muted;
    }

    if (emitChange) {
      this.mutedChanged.emit(this.muted);
    }
  }

  @HostListener('document:keyup.m', ['$event'])
  onMuteKey(event: KeyboardEvent) {
    if (this.keyboard) {
      this.toggleMuted();
      event.preventDefault();
    }
  }
}
