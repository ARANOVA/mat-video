import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { MatVideoModule } from 'projects/mat-video/src/public-api';
import { MatSelectModule } from '@angular/material/select';

import { MatSliderModule } from '@angular/material/slider'; 
import { LOCALE_ID } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { TestFormComponent } from './form/test-form/test-form.component';
registerLocaleData(localeEs);
import { ReactiveFormsModule } from '@angular/forms';
import { PercentToTimePipe } from './pipes/percent-to-time.pipe';
import { SecondsToTimePipe } from './pipes/seconds-to-time.pipe';
import { MatEditorControlComponent } from './components/mat-editor-control/mat-editor-control.component';
import { TcInputComponent } from 'mat-video/lib/ui/tc-input/tc-input.component';

@NgModule({
  declarations: [
    AppComponent,
    TestFormComponent,
    PercentToTimePipe,
    SecondsToTimePipe,
    MatEditorControlComponent,
    TcInputComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatRadioModule,
    MatVideoModule,
    MatSliderModule,
    MatButtonToggleModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
