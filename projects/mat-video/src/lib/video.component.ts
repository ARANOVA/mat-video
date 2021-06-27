import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from "@angular/core";
import { ThemePalette } from "@angular/material/core";

import { EventHandler } from "./interfaces/event-handler.interface";
import { EventService } from "./services/event.service";

interface HashNumber {
  [key: string]: number
}


@Component({
  selector: "mat-video",
  templateUrl: "./video.component.html",
  styleUrls: ["./video.component.scss", "./styles/icons.scss"]
})
export class MatVideoComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild("player") private player: ElementRef;
  @ViewChild("video") private video: ElementRef;

  @Input() src: string | MediaStream | MediaSource | Blob = null;
  @Input() title: string = null;
  @Input() autoplay = false;
  @Input() preload = true;
  @Input() loop = false;
  @Input() quality = true;
  @Input() fullscreen = true;
  @Input() playsinline = false;
  @Input() showFrameByFrame = false;
  @Input() showVolume = false;
  @Input() showSpeed = false;
  @Input() fps = 25;
  @Input() download = false;
  @Input() color: ThemePalette = "accent";
  @Input() spinner = "spin";
  @Input() poster: string = null;
  @Input() keyboard = true;
  @Input() overlay: boolean = null;
  @Input() muted = false;
  @Input() controlClass: string = '';
  @Input() headerClass: string = '';
  @Input() sliderClass: string = '';
  @Input() defaultCutType: string = 'invalid';
  @Input() orderConfiguration: HashNumber = {
    playButton: 0,
    frameByFrameControl: 1,
    volumeControl: 2,
    timeControl: 3,
    speedControl: 4,
    spacer: 5,
    qualityControl: 6,
    downloadButton: 7,
    fullscreenButton: 8
  };
  @Input() editorOrderButtons: HashNumber = {
    tcinInput: 0,
    tcinButton: 1,
    tcoutButton: 2,
    tcoutInput: 3,
    typeCutSelector: 4,
    spacer: 5,
    addButton: 6,
    saveButton: 7,
    removeButton: 8,
    resetButton: 9
  }
  @Output() mutedChange = new EventEmitter<boolean>();

  @Output() timeChange = new EventEmitter<number>();

  @Input()
  get time() {
    return this.getVideoTag().currentTime;
  }

  set time(val: number) {
    const video: HTMLVideoElement = this.getVideoTag();
    if (video && val) {
      if (val > video.duration) {
        val = video.duration;
      }
      if (val < 0) {
        val = 0;
      }
      if (Math.abs(val - video.currentTime) > 0.0001) {
        video.currentTime = val;
      }
      if (Math.abs(this.lastTime - video.currentTime) > 0.0001) {
        setTimeout(() => this.timeChange.emit(video.currentTime), 0);
        this.lastTime = video.currentTime;
      }
    }
  }

  playing = false;

  isFullscreen = false;

  videoWidth: number;
  videoHeight: number;
  lastTime: number;

  videoLoaded = false;

  private srcObjectURL: string;

  private isMouseMoving = false;
  private isMouseMovingTimer: NodeJS.Timer;
  private isMouseMovingTimeout = 2000;

  private events: EventHandler[];

  constructor(private renderer: Renderer2, private evt: EventService) {}

  ngAfterViewInit(): void {
    this.events = [
      {
        element: this.video.nativeElement,
        name: "loadstart",
        callback: event => (this.videoLoaded = false),
        dispose: null
      },
      {
        element: this.video.nativeElement,
        name: "loadedmetadata",
        callback: event => this.evLoadedMetadata(event),
        dispose: null
      },
      {
        element: this.video.nativeElement,
        name: "error",
        callback: event => console.error("Unhandled Video Error", event),
        dispose: null
      },
      {
        element: this.video.nativeElement,
        name: "contextmenu",
        callback: event => event.preventDefault(),
        dispose: null
      },
      {
        element: this.video.nativeElement,
        name: "timeupdate",
        callback: event => this.evTimeUpdate(event),
        dispose: null
      },
      {
        element: this.player.nativeElement,
        name: "mousemove",
        callback: event => this.evMouseMove(event),
        dispose: null
      }
    ];

    this.video.nativeElement.onloadeddata = () => (this.videoLoaded = true);

    this.evt.addEvents(this.renderer, this.events);

    this.setVideoSrc(this.src);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.src) {
      this.setVideoSrc(this.src);
    }
  }

  ngOnDestroy(): void {
    this.video.nativeElement.onloadeddata = null;

    this.evt.removeEvents(this.events);
  }

  load(): void {
    if (this.video && this.video.nativeElement) {
      this.video.nativeElement.load();
    }
  }

  getVideoTag(): HTMLVideoElement | null {
    return this.video && this.video.nativeElement ? (this.video.nativeElement as HTMLVideoElement) : null;
  }

  evLoadedMetadata(event: any): void {
    this.videoWidth = this.video.nativeElement.videoWidth;
    this.videoHeight = this.video.nativeElement.videoHeight;
    this.videoLoaded = true;
  }

  evMouseMove(event: any): void {
    this.isMouseMoving = true;
    clearTimeout(this.isMouseMovingTimer);
    this.isMouseMovingTimer = setTimeout(() => {
      this.isMouseMoving = false;
    }, this.isMouseMovingTimeout);
  }

  evTimeUpdate(event: any): void {
    this.time = this.getVideoTag().currentTime;
  }

  getOverlayClass(activeClass: string, inactiveClass: string): any {
    if (this.overlay === null) {
      return !this.playing || this.isMouseMoving ? activeClass : inactiveClass;
    } else {
      return this.overlay ? activeClass : inactiveClass;
    }
  }

  private setVideoSrc(src: string | MediaStream | MediaSource | Blob): void {
    if (this.srcObjectURL) {
      URL.revokeObjectURL(this.srcObjectURL);
      this.srcObjectURL = null;
    }

    if (!this.video || !this.video.nativeElement) {
      return;
    }

    if (!src) {
      this.video.nativeElement.src = null;
      if ("srcObject" in HTMLVideoElement.prototype) {
        this.video.nativeElement.srcObject = new MediaStream();
      }
    } else if (typeof src === "string") {
      this.video.nativeElement.src = src;
    } else if ("srcObject" in HTMLVideoElement.prototype) {
      this.video.nativeElement.srcObject = src;
    } else {
      this.srcObjectURL = URL.createObjectURL(src);
      this.video.nativeElement.src = this.srcObjectURL;
    }

    this.video.nativeElement.muted = this.muted;
  }

  log($event: any) {
    console.log($event);
  }
}
