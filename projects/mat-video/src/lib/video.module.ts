import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';

import { MatVideoSourceDirective } from './directives/mat-video-source.directive';
import { MatVideoTrackDirective } from './directives/mat-video-track.directive';
import { MinDirective } from './directives/min.directive';
import { MaxDirective } from './directives/max.directive';
import { MatSliderProgressBarComponent } from './internal/mat-slider-progress-bar/mat-slider-progress-bar.component';
import { SecondsToTimePipe } from './pipes/seconds-to-time.pipe';
import { EventService } from './services/event.service';
import { FullscreenService } from './services/fullscreen.service';
import { MatDownloadButtonComponent } from './ui/mat-download-button/mat-download-button.component';
import { MatFrameByFrameControlComponent } from './ui/mat-frame-by-frame-control/mat-frame-by-frame-control.component';
import { MatFullscreenButtonComponent } from './ui/mat-fullscreen-button/mat-fullscreen-button.component';
import { MatPlayButtonComponent } from './ui/mat-play-button/mat-play-button.component';
import { MatQualityControlComponent } from './ui/mat-quality-control/mat-quality-control.component';
import { MatSeekProgressControlComponent } from './ui/mat-seek-progress-control/mat-seek-progress-control.component';
import { MatTimeControlComponent } from './ui/mat-time-control/mat-time-control.component';
import { MatVideoSpinnerComponent } from './ui/mat-video-spinner/mat-video-spinner.component';
import { MatVolumeControlComponent } from './ui/mat-volume-control/mat-volume-control.component';
import { MatSpeedControlComponent } from './ui/mat-speed-control/mat-speed-control.component';
import { MatEditorControlComponent } from './ui/mat-editor-control/mat-editor-control.component';
import { MatVideoComponent } from './video.component';
import { MatInputTimeFormatDirective } from './directives/mat-time-format.directive';

@NgModule({
  declarations: [
    SecondsToTimePipe,
    MatVideoComponent,
    MatSliderProgressBarComponent,
    MatPlayButtonComponent,
    MatVolumeControlComponent,
    MatDownloadButtonComponent,
    MatFullscreenButtonComponent,
    MatTimeControlComponent,
    MatQualityControlComponent,
    MatVideoSpinnerComponent,
    MatSeekProgressControlComponent,
    MatVideoSourceDirective,
    MatVideoTrackDirective,
    MinDirective,
    MaxDirective,
    MatFrameByFrameControlComponent,
    MatSpeedControlComponent,
    MatEditorControlComponent,
    MatInputTimeFormatDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSliderModule,
    MatInputModule,
    MatRadioModule,
    MatMenuModule,
    MatMenuModule,
    MatBadgeModule
  ],
  exports: [
    MatVideoComponent,
    MatVideoSourceDirective,
    MatVideoTrackDirective,
    MatInputTimeFormatDirective
  ],
  providers: [FullscreenService, EventService]
})
export class MatVideoModule { }
