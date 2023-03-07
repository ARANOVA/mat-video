import { AfterViewInit, Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, Renderer2, SimpleChanges } from '@angular/core';

import { EventHandler } from '../../interfaces/event-handler.interface';
import { EventService } from '../../services/event.service';

@Component({
  template: ''
})
export class BaseUiComponent implements AfterViewInit, OnDestroy, OnChanges {

  @Input() video: HTMLVideoElement;

  @Input() keyboard = false;

  @Input() fps = 25;

  protected events: EventHandler[];

  constructor(private renderer: Renderer2, private evt: EventService) { }

  ngOnChanges(changes: SimpleChanges): void {
    // do something interesting
  }

  ngAfterViewInit(): void {
    if (this.events) {
      this.events.forEach(evt => evt.element = this.video);
      this.evt.addEvents(this.renderer, this.events);
    }
  }

  ngOnDestroy(): void {
    if (this.events) {
      this.evt.removeEvents(this.events);
    }
  }

}
