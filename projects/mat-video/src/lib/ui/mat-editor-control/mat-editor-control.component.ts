import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ThemePalette } from '@angular/material/core';


import { EventHandler } from '../../interfaces/event-handler.interface';
import { EventService } from '../../services/event.service';

interface CutInterface {
    tcin?: number;
    tcout?: number;
    type?: string;
    idx?: string;
    selected?: boolean;
    thumb?: string;
};

const countDecimals = (value) => {
  if (Math.floor(value) === value) {
    return 0;
  }
  return value.toString().split('.')[1].length || 0;
}

const roundFn = (number, increment, offset) => {
  const dec = 10 ** countDecimals(increment);
  return (Math.round(Math.round((number - offset) / increment) * increment * dec) / dec) + offset;
}

const randomString = (length: number) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

interface HashNumber {
  [key: string]: number
}

@Component({
  selector: 'mat-editor-control',
  templateUrl: './mat-editor-control.component.html',
  styleUrls: ['./mat-editor-control.component.scss']
})
export class MatEditorControlComponent implements OnChanges, AfterViewInit, OnDestroy {

  /**
   * Current time percent
   */
  curTimePercent = 0;

  /**
   * Current time min percent
   */
  curMinPercent = 0;

  /**
   * Current time max percent
   */
  curMaxPercent = 100;

  @Input() video: HTMLVideoElement = null;

  @Input() fps = 25;

  @Input() color: ThemePalette = 'accent';

  @Input() currentTime = 0;

  @Input() defaultCutType = 'cut';

  @Input() cutType: string | null = null;

  @Input() editorButtons: boolean = false;

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
  };

  @Output() currentTimeChanged = new EventEmitter<number>();

  @Input() cuts: any = [];

  @Input() marks: any = [];

  @Input() selected: string | null | undefined;
  @Input() selectedMarker: string | null | undefined;

  @Output() posterChanged = new EventEmitter<string>();

  @Output() selectedChanged = new EventEmitter<string | null>();

  @Output() selectedMarkChanged = new EventEmitter<string | null>();

  @Output() cutEvent = new EventEmitter<any>();

  /*
     * Initial copy of data
    */
  public modCuts!: any[];

  public selectedMark: CutInterface | null = null;
  public selectedCut: CutInterface | null = null;

  public inposition: number = 0;
  public outposition: number = 0;
  private events: EventHandler[];
  public fullWidth = 0;
  public mode = 'tcin';
  private __askFrame = true;
  private __videoSize: { w: number, h: number };
  private __focused: any;

  @ViewChild('trimmerBar') trimmerBar;
  @ViewChild('tcinInput') tcinInput;
  @ViewChild('tcoutInput') tcoutInput;

  constructor(
    private renderer: Renderer2,
    private evt: EventService
  ) { }

  ngAfterViewInit(): void {
    this.events = [
      { element: this.video, name: 'seeking', callback: event => this.updateCurrentTime(this.video.currentTime), dispose: null },
      {
        element: this.video, name: 'seeked', callback:
          event => {
            const aux = this.getFrame(this.video.currentTime);
            if (aux) {
              if (this.selectedCut && this.selectedCut.idx) {
                this.selectedCut.thumb = aux;
              } else {
                this.posterChanged.emit(aux);
              }
            }
          }
        , dispose: null
      },
      { element: this.video, name: 'timeupdate', callback: event => this.updateCurrentTime(this.video.currentTime), dispose: null },
      { element: this.video, name: 'loadeddata', callback: event => this.getVideoSize(event), dispose: null }
    ];
    this.fullWidth = this.trimmerBar.nativeElement.offsetWidth;
    this.evt.addEvents(this.renderer, this.events);
    // 
    setTimeout(() => {
      if (this.cuts) {
        this.modCuts = this.cuts.map((cut: any) => { return { ...cut } });
        this.modCuts.sort((a, b) => a.tcin - b.tcin);
        this.cuts.sort((a, b) => a.tcin - b.tcin);
      } else {
        this.cuts = [];
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selected) {
      if (changes.selected.currentValue) {
        this.selectCut(null, changes.selected.currentValue, false);
      } else if (changes.selected.currentValue === null) {
        this.deselectCut(null, false);
      }
    }
    if (changes.selectedMarker) {
      if (changes.selectedMarker.currentValue) {
        this.selectMark(null, changes.selectedMarker.currentValue, false);
      } else if (changes.selectedMarker.currentValue === null) {
        this.deselectMark(null, false);
      }
    }
  }

  setTcIn(update: boolean = true) {
    this.__askFrame = true;
    const prevTCin = this.currentTime;
    this.inposition = roundFn(this.currentTime, 0.04, 0);
    const prev = !!this.selectedCut;
    if (!this.selectedCut) {
      this.selectedCut = {
        tcin: this.inposition,
        tcout: this.inposition,
        type: this.cutType ? this.cutType : this.defaultCutType,
        selected: true,
        idx: ''
      };
    }
    if (update) {
      this.selectedCut.tcin = roundFn(this.video.currentTime, 0.04, 0);
    }
    if (this.mode === 'tcin') {
      this.mode = 'tcout';
      this.selectedCut.selected = true;
      if (!this.selectedCut.idx) {
        this.cuts.push(this.selectedCut);
        // TEMP this.selectedCut.idx = randomString(8);
      }
    } else {
      this.mode = 'tc';
    }
    if (update) {
      if (this.selectedCut.tcout && this.selectedCut.tcout < this.selectedCut.tcin) {
        this.selectedCut.tcout = this.selectedCut.tcin + prevTCin;
        if (this.selectedCut.tcout > this.video.duration) {
          this.selectedCut.tcout = this.video.duration;
        }
      }
      this.seekVideo(this.selectedCut.tcin / this.video.duration * 100);
    }
  }

  setTcOut() {
    this.selectedCut.tcout = roundFn(this.video.currentTime, 0.04, 0);
    this.mode = 'tc';
  }

  restart() {
    if (!this.selectedCut.idx) {
      this.cuts.pop();
    }
    this.selectedCut = null;
    this.mode = 'tcin';
    const roundedTime = roundFn(this.currentTime, 0.04, 0);
    this.inposition = roundedTime;
    console.log(0)
    this.outposition = roundedTime;
  }

  resetCut(partial?: boolean) {
    if (!partial) {
      this.selectedCut = {
        tcin: 0,
        tcout: 0,
        type: this.cutType ? this.cutType : this.defaultCutType,
        idx: ''
      };
      this.mode = 'tcin';
    } else {
      this.selectedCut.tcout = 0;
      this.selectedCut.idx = randomString(8);
    }
  }

  removeCut() {
    if (this.selectedCut.idx) {
      this.cutEvent.emit({ type: 'remove', cut: { ...this.selectedCut } });
      this.selectedCut = null;
    }
    this.mode = 'tcin';
  }

  addCut() {
    if (!this.selectedCut.idx) {
      this.selectedCut.idx = randomString(8);
    }
    this.cutEvent.emit({ type: 'add', cut: { ...this.selectedCut } });
    this.deselectCut();
    /*
    this.resetCut(false);
    this.selectedCut.tcin = this.selectedCut.tcout =
      this.tcinInput.nativeElement.value = roundFn(this.currentTime, 0.04, 0);
    setTimeout(() => {
      this.tcinInput.nativeElement.select();
    }, 300);
    */
  }

  
  getClassCut(cut: CutInterface, forceCls?: string) {
    const cls = [forceCls ? forceCls : (cut.type === 'mark' ? 'cut' : cut.type)];
    if (cut.selected) {
      cls.push('selected');
    }
    if (!cut.idx) {
      cls.push('editing');
    }
    return cls;
  }

  editCut() {
    this.selectedCut.selected = false;
    this.cutEvent.emit({ type: 'edit', cut: { ...this.selectedCut } });
    this.mode = 'tc';
    this.deselectCut();
  }

  deselectCut($event?: MouseEvent, emit: boolean = true) {
    if ($event) {
      $event.stopPropagation();
    }
    if (emit) {
      this.selectedChanged.emit(null);
    }

    this.curMinPercent = 0;
    this.curMaxPercent = 100;
    this.mode = 'tcin';
    if (this.selectedCut) {
      this.restart();
    }

    if (this.mode !== 'tcin' && this.mode !== 'tcout') {
      // Select & zoom
      /* TEST
      this.selectedCut.selected = false;
      const tcin = this.selectedCut.tcin;
      this.resetCut();
      this.selectedCut.tcin = tcin;
      this.mode = 'tcin';
      */
      //this.curTimePercent = this.updateTime(this.currentTimeChanged, this.currentTime);

    }
  }

  private __selectCut(idx: string | null = null): void {
    if (this.cuts) {
      const index = this.cuts.findIndex((cut: any) => cut.idx === idx);
      if (index > -1) {
        this.selectedCut = this.cuts[index];
        this.seekVideo(this.selectedCut.tcin / this.video.duration * 100);
        this.mode = 'tc';
      }
    }
    // setTimeout(() => this.mode = 'tcin', 200);
  }

  private __selectMark(idx: string | null = null): void {
    if (this.marks) {
      const index = this.marks.findIndex((mark: any) => mark.idx === idx);
      if (index > -1) {
        this.selectedMark = this.marks[index];
        this.seekVideo(this.selectedMark.tcin / this.video.duration * 100);
      }
    }
    // setTimeout(() => this.mode = 'tcin', 200);
  }

  selectCut($event: MouseEvent, idx: string | null = null, emit: boolean = true) {
    if ($event) {
      $event.stopPropagation();
    }
    if (emit) {
      setTimeout(() => this.selectedChanged.emit(idx), 0);
    }
    this.__selectCut(idx);
  }

  deselectMark($event?: MouseEvent, emit: boolean = true) {
    if ($event) {
      $event.stopPropagation();
    }
    if (emit) {
      this.selectedMarkChanged.emit(null);
    }
  }

  selectMark($event: MouseEvent, idx: string | null = null, emit: boolean = true) {
    if ($event) {
      $event.stopPropagation();
    }
    if (emit) {
      setTimeout(() => this.selectedMarkChanged.emit(idx), 0);
    }
    this.__selectMark(idx);
  }

  getStartCut(tcin: number, tcout?: number): number {
    if (!this.trimmerBar) {
      return 0;
    }
    this.fullWidth = this.trimmerBar.nativeElement.offsetWidth;
    if (tcout) {
      // Hacer media
      tcin = tcin + (tcout - tcin) / 2;
    }
    if (tcin > 0 && this.fullWidth && this.video.duration) {
      const l = (tcin / this.video.duration) * this.fullWidth;
      return Math.round(l / (100 / (this.curMaxPercent - this.curMinPercent)));
    }
  }

  getWidthCut(tcin: number, tcout?: number): number {
    if (!this.trimmerBar) {
      return 0;
    }
    if (!tcout) {
      return 2;
    }
    this.fullWidth = this.trimmerBar.nativeElement.offsetWidth;
    const max = Math.min(tcout, this.video.duration);
    if (tcout > this.video.duration + 0.04) {
      return 2;
    }
    const w = (max / this.video.duration) * this.fullWidth;
    const l = (tcin / this.video.duration) * this.fullWidth;
    return Math.round(Math.max(2, (w - l) * (100 / (this.curMaxPercent - this.curMinPercent))));

  }

  ngOnDestroy(): void {
    this.evt.removeEvents(this.events);
  }

  seekVideo(value: number): void {
    const percentage = value / 100;
    const newTime = this.video.duration * percentage;
    this.video.currentTime = newTime;
    const roundedTime = roundFn(this.video.currentTime, 0.04, 0);
    if (this.selectedCut) {
      if (this.mode === 'tcin') {
        this.selectedCut.tcin = roundedTime;
        this.inposition = roundFn(this.selectedCut.tcin, 0.04, 0);
      } else if (this.mode === 'tcout') {
        if (this.selectedCut.tcin > this.video.currentTime) {
          if (!this.selectedCut.tcout) {
            this.selectedCut.tcout = this.selectedCut.tcin;
          }
          this.selectedCut.tcin = roundedTime;
        } else {
          this.selectedCut.tcout = roundedTime;
        }
        console.log(1, this.selectedCut)
        if (!this.__focused) {
          this.outposition = roundFn(this.selectedCut.tcout, 0.04, 0);
        }
      }
      
    } else {
      // Actualizar tcin
      this.inposition = roundFn(this.video.currentTime, 0.04, 0);
    }
  }

  getFrame(time: number): string | null {
    if (this.__askFrame) {
      const canvas = document.createElement('canvas');
      const w = 240;
      let h = 135; // 16:9
      if (this.__videoSize) {
        h = Math.round(this.__videoSize.h * 240 / this.__videoSize.w);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(this.video, 0, 0, w, h);
      this.__askFrame = false;
      return canvas.toDataURL();
    }
    return null;
  }

  getVideoSize(event: any) {
    this.__videoSize = {
      w: event.target.videoWidth,
      h: event.target.videoHeight
    }
  }

  updateCurrentTime(time: number): void {
    this.currentTime = time;
    this.curTimePercent = this.updateTime(this.currentTimeChanged, this.currentTime);
  }

  updateTime(emitter: EventEmitter<number>, time: number): number {
    emitter.emit(time);
    return (time / this.video.duration) * 100;
  }

  keyup(input: string, event: KeyboardEvent) {
    if (this.__focused) {
      clearTimeout(this.__focused);
    }
    if (event.key === 'Enter') { // Solo numérico
      if (input === 'tcin') {
        this.seekVideo(this.inposition / this.video.duration * 100);
        this.setTcIn();
        this.tcoutInput.nativeElement.focus();
        setTimeout(() => this.tcoutInput.nativeElement.select(), 100);
        this.outposition = roundFn(this.video.currentTime, 0.04, 0);
      } else {
        if (this.mode !== 'tcout') {
          this.setTcIn(false);
        }
        this.seekVideo(this.outposition / this.video.duration * 100);
        this.setTcOut();
      }
    } else {
      this.__focused = setTimeout(() => {
        this.seekVideo((input == 'tcin' ? this.inposition : this.outposition) / this.video.duration * 100);
      }
        , 300);
    }
  }

}
