import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { repeat, skipUntil, takeUntil } from 'rxjs/operators';

import { EventHandler } from '../../interfaces/event-handler.interface';
import { ClipInterface } from '../../interfaces/clip.interface';
import { EventService } from '../../services/event.service';
import { fromEvent } from 'rxjs';


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

  private __events: EventHandler[];
  private __barWidth = 0;
  private __askFrame = true;
  private __videoSize: { w: number, h: number };
  private __focused: any;
  private __lastthumb: { thumb: string; idx: string | null } | null = { thumb: '', idx: null };

  @Input() video: HTMLVideoElement = null;

  @Input() fps: number = 25;

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

  @Input() cuts: any = [];

  @Input() marks: any = [];

  @Input() selected: string | null | undefined;

  @Input() selectedMarker: string | null | undefined;

  @Input() keyboard = true;

  @Output() currentTimeChanged = new EventEmitter<number>();

  @Output() posterChanged = new EventEmitter<{ thumb: string; idx: string | null }>();

  @Output() selectedChanged = new EventEmitter<string | null>();

  @Output() selectedMarkChanged = new EventEmitter<string | null>();

  @Output() cutEvent = new EventEmitter<any>();

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

  /**
   * Selected mark
   */
  selectedMark: ClipInterface | null = null;

  /**
   * Selected cut
   */
  selectedCut: ClipInterface | null = null;

  /**
   * NgModel for tc input
   */
  public inposition: number = 0;

  /**
   * NgModel for tc output
   */
  public outposition: number = 0;

  /**
   * Editing mode
   */
  public mode = 'tcin';  // Valida are 'tcin', 'tcout' and 'tc'

  /**
   * Trimming mode
   */
  public editing = '';  // Para trimado con Ctrl

  /**
   * Emitted when a fcus event
   */
  @Output() focused = new EventEmitter<boolean>();

  @ViewChild('trimmerBar') trimmerBar;
  @ViewChild('tcinInput') tcinInput;
  @ViewChild('tcoutInput') tcoutInput;

  /* Click and drag: https://stackblitz.com/edit/angular-mousemove-after-mouse-down?file=app%2Fmouse-events%2Fmouse-events.component.ts */
  mouseup$: any;
  mousedown$: any;
  mousemove$: any;
  mousehold$: any;
  keyboard$: any;
  x: number;
  y: number;
  private _sub: any;
  private _sub2: any;
  ctrlKey: boolean = false;
  private __seek: any;

  constructor(
    private renderer: Renderer2,
    private evt: EventService,
    private _el: ElementRef
  ) { }

  private __delaySeek() {
    if (this.__seek) {
      clearTimeout(this.__seek);
    }
    this.__seek = setTimeout(() => {
      this.video.currentTime = this.currentTime;
    }, 250);
  }

  private __register() {
    this._sub = this.mousehold$.subscribe((e) => {
      if (!this.ctrlKey) {
        return;
      }
      this.x = e.x;
      this.y = e.y;
console.log("hold")
      if (this.selectedCut) {
        this.selectedCut.selected = true;
        var rect = this.trimmerBar.nativeElement.getBoundingClientRect();
        this.__barWidth = this.trimmerBar.nativeElement.offsetWidth;
        const tc = this.video.duration * (this.x - rect.left) / this.__barWidth;
        this.currentTime = roundFn(tc, 1 / this.fps, 0);
        this.__delaySeek();
        if (this.editing === '' || this.editing === 'out') {
          this.outposition = this.currentTime;
          this.selectedCut.tcout = this.currentTime;
        } else if (this.editing === 'in') {
          this.inposition = this.currentTime;
          this.selectedCut.tcin = this.currentTime;
        }
      }
    });
    this._sub2 = this.mouseup$.subscribe((e) => {
      this.__unsub();
      this.mode = 'tc';
      this.editing = '';
      // this.addCut();
    });
  }

  ngAfterViewInit(): void {
    this.__events = [
      // { element: this.video, name: 'seeking', callback:
      //     () => {
      //       return this.updateCurrentTime(this.video.currentTime);
      //     }, dispose: null
      // },
      {
        element: this.video, name: 'seeked2', callback:
          () => {
            // Test
            this.updateCurrentTime(this.video.currentTime);
            const aux = this.getFrame(this.video.currentTime);
            // TODO: limitar a no edición
            if (aux) {
              if (this.selectedCut) {
                this.posterChanged.emit({ thumb: aux, idx: this.selectedCut.idx });
              } else {
                this.__lastthumb.thumb = aux;
                this.posterChanged.emit(this.__lastthumb);
              }
            }
          }, dispose: null
      },
      { element: this.video, name: 'timeupdate', callback: () => this.updateCurrentTime(this.video.currentTime), dispose: null },
      { element: this.video, name: 'loadeddata', callback: event => this.getVideoSize(event), dispose: null }
    ];
    this.__barWidth = this.trimmerBar.nativeElement.offsetWidth;
    this.evt.addEvents(this.renderer, this.__events);

    this.mousedown$ = fromEvent(this.trimmerBar.nativeElement, 'mousedown');
    this.mousedown$.subscribe((e) => {
      if (!this.ctrlKey) {
        return;
      }
      console.log("MOUSE DOWN", e.x, e.y, this.trimmerBar.nativeElement.getBoundingClientRect())
      this.__register();
      this.x = e.x;
      this.y = e.y;
      var rect = this.trimmerBar.nativeElement.getBoundingClientRect();
      this.__barWidth = this.trimmerBar.nativeElement.offsetWidth;
      const tc = this.video.duration * (this.x - rect.left) / this.__barWidth;

      if (this.selectedCut && this.mode !== 'tcin') {
        // Es una "edición"
        const duration = this.selectedCut.tcout - this.selectedCut.tcin;
        console.log("IN", tc, '<', this.selectedCut.tcin + duration / 2)
        if (tc < this.selectedCut.tcin + duration / 2) {
          // Edita entrada
          this.editing = 'in';
          this.setTcIn(true, roundFn(tc, 1 / this.fps, 0));
        } else {
          this.editing = 'out';
          console.log("UPDATE SALIDA")
          // Edita salida
          this.setTcOut(true, roundFn(tc, 1 / this.fps, 0), 'tcout');
        }
        console.log(this.selectedCut)
      } else {
        this.setTcIn(true, roundFn(tc, 1 / this.fps, 0));
      }
      
    })
    this.mousemove$ = fromEvent(this.trimmerBar.nativeElement, 'mousemove');
    this.mouseup$ = fromEvent(this.trimmerBar.nativeElement, 'mouseup');

    this.mousehold$ = this.mousemove$.pipe(
      skipUntil(this.mousedown$),
      takeUntil(this.mouseup$),
      repeat()
    );

    this.mousemove$.subscribe(_ => { });
    this.__register();
  }

  @HostListener('window:keyup.control', ['$event'])
  up($event: any) {
    this.ctrlKey = false;
  }

  @HostListener('window:keydown.control', ['$event'])
  down($event: any) {
    this.ctrlKey = true;
  }

  @HostListener('window:keydown.delete', ['$event'])
  delete($event: any) {
    console.log(!this.keyboard, !this.selectedCut, !this.selectedCut.idx)
    if (!this.keyboard || !this.selectedCut) {
      return;
    }
    if (this.mode !== 'tcin' && !this.selectedCut.idx) {
      this.restart();
    } else if (this.selectedCut.idx) {
      this.removeCut();
    }
  }

  /**
   * To update interface
   * 
   * @param changes 
   */
  ngOnChanges(changes: SimpleChanges): void {
    // 
    if (changes.selected) {
      this.selectClip(null, changes.selected.currentValue, this.cuts, false);
    }
    if (changes.selectedMarker) {
      this.selectClip(null, changes.selectedMarker.currentValue, this.marks, false);
    }
  }



  private __unsub() {
    if (this._sub) {
      this._sub.unsubscribe();
      this._sub2.unsubscribe();
      this._sub = null;
    }
  }

  private __createEmptyCut(): ClipInterface {
    return <ClipInterface>{
      tcin: this.inposition,
      tcout: this.inposition,
      type: this.cutType ? this.cutType : this.defaultCutType,
      selected: true,
      idx: ''
    }
  }

  private __select(idx: string | null = null, collection: ClipInterface[]): boolean {
    if (idx && collection) {
      const index = collection.findIndex((cut: any) => cut.idx === idx);
      if (index > -1) {
        if (collection === this.cuts) {
          this.selectedCut = collection[index];
          this.mode = 'tc';
          this.__askFrame = true;
        }
        this.seekVideo(collection[index].tcin / this.video.duration * 100, collection);
        return true;
      }
    }
    if (this.selectedCut && collection === this.cuts) {
      this.restart();
    }
  }

  /**
   * Sets the tc input point
   * 
   * @param {boolean} update    if the selected value cut must be update
   */
  setTcIn(update: boolean = true, tcin?: number, mode?: string) {
    const prevTCin = this.currentTime;
    this.inposition = tcin || roundFn(this.currentTime, 1 / this.fps, 0);
    if (!this.selectedCut) {
      this.selectedCut = this.__createEmptyCut();
      this.outposition = tcin || roundFn(this.currentTime, 1 / this.fps, 0);
    } else if (update) {
      this.selectedCut.tcin = tcin || roundFn(this.video.currentTime, 1 / this.fps, 0);
      if (this.selectedCut.tcout && this.selectedCut.tcout < this.selectedCut.tcin) {
        console.log("UPDATE1")
        this.selectedCut.tcout = this.selectedCut.tcin + prevTCin;
        if (this.selectedCut.tcout > this.video.duration) {
          this.selectedCut.tcout = this.video.duration;
        }
      }
      if (!tcin) {
        console.log("UPDATE2")
        this.outposition = roundFn(this.currentTime, 1 / this.fps, 0);
        this.__lastthumb.idx = this.selectedCut.idx;
        this.posterChanged.emit(this.__lastthumb);
      }
      this.seekVideo(this.selectedCut.tcin / this.video.duration * 100, this.cuts, !!!tcin);
    }
    if (!tcin) {
      console.log("1")
      if (this.mode === 'tcin') {
        mode = mode ? mode : 'tcout';
        this.selectedCut.selected = true;
        if (!this.selectedCut.idx) {
          this.cutEvent.emit({ type: 'tcin', cut: { ...this.selectedCut } });
        }
      }
    }
    this.mode = mode ? mode : 'tc';
  }

  /**
   * Sets the tc output point
   */
  setTcOut(update: boolean = false, tcout?: number, mode?: string) {
    console.log("setTcOut")
    this.outposition = tcout || roundFn(this.currentTime, 1 / this.fps, 0);
    this.selectedCut.tcout = tcout || roundFn(this.video.currentTime, 1 / this.fps, 0);
    this.mode = mode ? mode : 'tc';
    if (update) {
      this.seekVideo(this.selectedCut.tcout / this.video.duration * 100, this.cuts);
    }
  }

  /**
   * Restart selected cut
   */
  restart(emit: boolean = true) {
    if (emit && this.selectedCut && !this.selectedCut.idx) {
      // Si ya estaba añadido buscar y eliminar en el padre
      this.cutEvent.emit({ type: 'reset', cut: { ...this.selectedCut } });
    }
    this.selectedCut = null;
    this.mode = 'tcin';
    const roundedTime = roundFn(this.currentTime, 1 / this.fps, 0);
    this.inposition = this.outposition = roundedTime;
  }

  /**
   * Remove selected cut
   */
  removeCut() {
    this.cutEvent.emit({ type: 'remove', cut: { ...this.selectedCut } });
    this.selectedCut = null;
    this.mode = 'tcin';
  }

  /**
   * Add selected cut to list
   */
  addCut() {
    this.selectedCut.selected = false;
    if (!this.selectedCut.idx) {
      this.selectedCut.idx = randomString(8);
      if (this.__lastthumb.thumb) {
        this.selectedCut.thumb = this.__lastthumb.thumb;
        this.__lastthumb = { thumb: '', idx: null };
      }
    }
    this.cutEvent.emit({ type: 'add', cut: { ...this.selectedCut } });
    this.restart(false);
  }

  /**
   * Edit selected cut
   */
  editCut() {
    this.mode = 'tc';
    this.selectedCut.selected = false;
    this.cutEvent.emit({ type: 'edit', cut: { ...this.selectedCut } });
    this.restart(false);
  }

  /**
   * Return list of class  for the block
   * 
   * @param {ClipInterface} cut             the cut
   * @param {string | undefined} forceCls   the forced class (from HTML loop)
   * @returns {string[]}
   */
  getClassCut(cut: ClipInterface, forceCls?: string): string[] {
    const cls = [forceCls ? forceCls : (cut.type === 'mark' ? 'cut' : cut.type)];
    if (cut.selected) {
      cls.push('selected');
    }
    if (!cut.idx) {
      cls.push('editing');
    }
    return cls;
  }

  /**
   * Select / Deselect current cut
   * 
   * @param $event 
   * @param idx 
   * @param emit 
   */
  selectClip($event: MouseEvent, idx: string | null = null, collection: ClipInterface[], emit: boolean = true) {
    if ($event) {
      $event.stopPropagation();
    }
    if (!collection || this.ctrlKey) {
      return;
    }
    this.__select(idx, collection);
    if (emit) {
      if (collection === this.cuts) {
        setTimeout(() => this.selectedChanged.emit(idx), 0);
      } else {
        setTimeout(() => this.selectedMarkChanged.emit(idx), 0);
      }
    }
  }

  /**
   * Get left position of cut block (UI)
   * 
   * @param {number} tcin               the tc input value
   * @param {number | undefined} tcout  the tc output value
   * @returns {number}
   */
  getStartCut(tcin: number, tcout?: number): number {
    if (!this.trimmerBar) {
      return 0;
    }
    this.__barWidth = this.trimmerBar.nativeElement.offsetWidth;
    if (tcout) {
      // Hacer media, es una marca
      tcin = tcin + (tcout - tcin) / 2;
    }
    if (tcin > 0 && this.__barWidth && this.video.duration) {
      const l = (tcin / this.video.duration) * this.__barWidth;
      return Math.round(l / (100 / (this.curMaxPercent - this.curMinPercent)));
    }
  }

  /**
   * Get width of cut block (UI)
   * 
   * @param {number} tcin               the tc input value
   * @param {number | undefined} tcout  the tc output value
   * @returns {number}
   */
  getWidthCut(tcin: number, tcout?: number): number {
    if (!this.trimmerBar) {
      return 0;
    }
    if (!tcout || tcout > this.video.duration + 1 / this.fps) {
      return 2;
    }
    this.__barWidth = this.trimmerBar.nativeElement.offsetWidth;
    const max = Math.min(tcout, this.video.duration);
    const w = (max / this.video.duration) * this.__barWidth;
    const l = (tcin / this.video.duration) * this.__barWidth;
    return Math.round(Math.max(2, (w - l) * (100 / (this.curMaxPercent - this.curMinPercent))));
  }

  /**
   * Destroy component
   */
  ngOnDestroy(): void {
    this.__unsub();
    this.evt.removeEvents(this.__events);
  }

  /**
   * Emit the focus signal
   * 
   * @param {boolean} value focus value
   */
  public focus(value: boolean): void {
    this.focused.emit(value);
  }

  /**
   * Seek video position (in seconds)
   * 
   * @param value 
   */
  seekVideo(value: number, collection: ClipInterface[], update: boolean = true): void {
    if (isNaN(value)) {
      return;
    }
    const percentage = value / 100;
    const newTime = this.video.duration * percentage;
    if (newTime === this.currentTime) {
      return;
    }
    if (!this.__lastthumb.thumb && collection == this.cuts) {
      this.__askFrame = true;
    }
    this.video.currentTime = newTime;
    if (!update) {
      return;
    }
    const roundedTime = roundFn(this.video.currentTime, 1 / this.fps, 0);
    if (this.selectedCut && collection === this.cuts) {
      if (this.mode === 'tcin') {
        this.selectedCut.tcin = roundedTime;
        this.inposition = roundFn(this.selectedCut.tcin, 1 / this.fps, 0);
      } else if (this.mode === 'tcout') {
        this.selectedCut.tcout = roundedTime;
        if (!this.__focused) {
          this.outposition = roundFn(this.selectedCut.tcout, 1 / this.fps, 0);
        }
      } else {
        if (!this.__focused) {
          this.inposition = this.selectedCut.tcin;
          this.outposition = this.selectedCut.tcout;
        }
      }
    } else {
      // Actualizar tcin
      this.inposition = roundFn(this.video.currentTime, 1 / this.fps, 0);
    }
  }

  /**
   * Capture the frame
   * 
   * @param {number}  time    the time of the frame
   * @returns {string | null}
   */
  getFrame(time: number): string | null {
    if (this.__askFrame) {
      const canvas = document.createElement('canvas');
      const w = 127;
      let h = 76; // 16:9
      if (this.__videoSize) {
        h = Math.round(this.__videoSize.h * w / this.__videoSize.w);
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
    if (this.mode == 'tcout') {
      this.outposition = roundFn(time, 1 / this.fps, 0);
    } else if (this.mode == 'tcin') {
      this.inposition = roundFn(time, 1 / this.fps, 0);
    }
    return (time / this.video.duration) * 100;
  }

  keyup(input: string, event: KeyboardEvent) {
    if (this.__focused) {
      clearTimeout(this.__focused);
    }
    if (!this.keyboard) {
      return;
    }
    if (event.key === 'Enter') { // Solo numérico
      if (input === 'tcin') {
        this.seekVideo(this.inposition / this.video.duration * 100, this.cuts);
        this.setTcIn();
        this.tcoutInput.nativeElement.focus();
        setTimeout(() => this.tcoutInput.nativeElement.select(), 100);
        this.outposition = roundFn(this.video.currentTime, 1 / this.fps, 0);
      } else {
        if (this.mode !== 'tcout') {
          this.setTcIn(false);
        }
        this.seekVideo(this.outposition / this.video.duration * 100, this.cuts);
        this.setTcOut();
      }
    } else {
      this.__focused = setTimeout(() => {
        this.seekVideo((input == 'tcin' ? this.inposition : this.outposition) / this.video.duration * 100, this.cuts);
      }, 300);
    }
  }

  incr(input: string) {
    if (input === 'tcin') {
      this.inposition = roundFn(this.inposition + 1/this.fps, 1/this.fps, 0);
      if (this.inposition > this.video.duration) {
        this.inposition = this.video.duration;
      }
    }
  }

  decr(input: string) {
    if (input === 'tcin') {
      this.inposition = roundFn(this.inposition - 1/this.fps, 1/this.fps, 0);
      if (this.inposition < 0) {
        this.inposition = 0;
      }
    }
  }

}
