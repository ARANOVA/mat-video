import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { repeat, skipUntil, takeUntil } from 'rxjs/operators';
import { Observable, Subject, Subscription, fromEvent } from 'rxjs';

import { EventHandler } from '../../interfaces/event-handler.interface';
import { ClipInterface } from '../../interfaces/clip.interface';
import { BaseUiComponent } from '../base/base.component';
import { StyleInterface } from '../../interfaces/style.interface';


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
  selector: 'app-mat-editor-control',
  templateUrl: './mat-editor-control.component.html',
  styleUrls: ['./mat-editor-control.component.scss']
})
export class MatEditorControlComponent extends BaseUiComponent implements OnDestroy, OnChanges, AfterViewInit {

  private __barWidth = 0;
  private __askFrame = true;
  private __videoSize: { w: number, h: number };
  private __focusedTimeout: string | number | NodeJS.Timeout;
  private __lastthumb: { thumb: string; idx: string | null } | null = { thumb: '', idx: null };
  private __bgs = {
    cut: '#ed5b08',
    invalid: 'repeating-linear-gradient(-45deg, rgba(0, 0, 0, 0) 5px, rgba(255, 255, 255, 0) 10px, #ed5b08 5px, #ed5b08 15px)',
    audio: '#999999',
    mark: 'repeating-linear-gradient(45deg,rgba(0, 0, 0, 0) 5px,rgba(255, 255, 255, 0) 10px,rgba(255, 255, 255, 0.2) 5px,rgba(255, 255, 255, 0.2) 15px'
  }
  private __clickTimeout: string | number | NodeJS.Timeout;

  @Input() color: ThemePalette = 'accent';

  @Input() currentTime = 0;

  @Input() defaultCutType = 'cut';

  @Input() cutType: string | null = null;

  @Input() editorButtons = false;

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

  @Input() cuts: ClipInterface[] = [];

  @Input() marks: ClipInterface[] = [];

  @Input() selected: string | null | undefined;

  @Input() selectedMarker: string | null | undefined;

  @Input() playCut: string | null | undefined;

  @Input() keyboard = true;

  @Output() currentTimeChanged = new EventEmitter<number>();

  @Output() posterChanged = new EventEmitter<{ thumb: string; idx: string | null }>();

  @Output() selectedChanged = new EventEmitter<string | null>();

  @Output() selectedMarkChanged = new EventEmitter<string | null>();

  @Output() cutEvent = new EventEmitter<unknown>();

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
  public inposition = 0;

  /**
   * NgModel for tc output
   */
  public outposition = 0;

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
  mouseup$: Observable<{x: number, y: number}>;
  mousedown$: Observable<{x: number, y: number}>;
  mousemove$: Observable<{x: number, y: number}>;
  mousehold$: Observable<{x: number, y: number}>;
  keyboard$: Observable<unknown>;
  x: number;
  y: number;
  disabled = true;
  private _sub: Subscription;
  private _sub2: Subscription;
  ctrlKey = false;
  private __seekTimeout: string | number | NodeJS.Timeout;
  private __intervalTimeout: string | number | NodeJS.Timeout;

  public styles: {
    cuts: { [key: string]: StyleInterface },
    marks: { [key: string]: StyleInterface },
    selected: { [key: string]: StyleInterface }
  } = {
      cuts: {},
      marks: {},
      selected: {}
    };

  protected events: EventHandler[] = [
    { element: null, name: 'seeking', callback: () => this.disabled = true, dispose: null },
    { element: null, name: 'seeked', callback: () => { this.disabled = false; this.updateCurrentTime(this.video.currentTime) }, dispose: null },
    { element: null, name: 'timeupdate', callback: () => this.updateCurrentTime(this.video.currentTime), dispose: null },
    {
      element: null, name: 'loadeddata', callback: (event) => {
        this.disabled = false;
        this.getVideoSize(event as unknown as { target: { videoWidth: number, videoHeight: number}});
        this.composeStyles('cuts', this.cuts);
        this.composeStyles('marks', this.marks);
      }, dispose: null
    },
  ];

  private __delaySeek() {
    if (this.__seekTimeout) {
      clearTimeout(this.__seekTimeout);
    }
    this.__seekTimeout = setTimeout(() => {
      console.log("this.currentTime", this.currentTime)
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
      if (this.selectedCut) {
        this.selectedCut.selected = true;
        const rect = this.trimmerBar.nativeElement.getBoundingClientRect();
        this.__barWidth = this.trimmerBar.nativeElement.offsetWidth;
        const leftPercent = (this.x - rect.left) * (this.curMaxPercent - this.curMinPercent) / this.__barWidth;
        const tc = (leftPercent + this.curMinPercent) * this.video.duration / 100;
        console.log("roundFn", roundFn(tc, 1 / this.fps, 0))
        this.currentTime = roundFn(tc, 1 / this.fps, 0);
        this.__delaySeek();
        if (this.editing === '' || this.editing === 'out') {
          this.outposition = this.currentTime;
          this.selectedCut.tcout = this.currentTime;
        } else if (this.editing === 'in') {
          this.inposition = this.currentTime;
          this.selectedCut.tcin = this.currentTime;
        }
        this.composeStyles('selected', [this.selectedCut]);
        // Si es una edición, es necesario también actualizar el "original"
        if (this.selectedCut.idx && ['cut', 'invalid'].indexOf(this.cutType) > -1) {
          this.composeStyles('cuts', [this.selectedCut], 'update')
        }
      }
    });
    this._sub2 = this.mouseup$.subscribe(() => {
      // this.__unsub();
      this.mode = 'tc';
      this.editing = '';
      // this.addCut();
    });
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.__barWidth = this.trimmerBar.nativeElement.offsetWidth;
    this.mousedown$ = fromEvent(this.trimmerBar.nativeElement, 'mousedown');
    this.mousemove$ = fromEvent(this.trimmerBar.nativeElement, 'mousemove');
    this.mouseup$ = fromEvent(this.trimmerBar.nativeElement, 'mouseup');
    this.mousehold$ = this.mousemove$.pipe(
      skipUntil(this.mousedown$),
      takeUntil(this.mouseup$),
      repeat()
    );

    // this.mousemove$.subscribe(() => {
    //   // do something interesting
    // });

    this.mousedown$.subscribe((e: { x: number, y: number }) => {
      if (!this.ctrlKey) {
        return;
      }
      this.x = e.x;
      this.y = e.y;
      const rect = this.trimmerBar.nativeElement.getBoundingClientRect();
      this.__barWidth = this.trimmerBar.nativeElement.offsetWidth;
      const leftPercent = (this.x - rect.left) * (this.curMaxPercent - this.curMinPercent) / this.__barWidth;
      const tc = (leftPercent + this.curMinPercent) * this.video.duration / 100;
      if (this.selectedCut && this.mode !== 'tcin') {
        // Es una "edición"
        const duration = this.selectedCut.tcout - this.selectedCut.tcin;
        if (tc < this.selectedCut.tcin + duration / 2) {
          // Edita entrada
          this.editing = 'in';
          this.setTcIn(true, roundFn(tc, 1 / this.fps, 0));
        } else {
          this.editing = 'out';
          // Edita salida
          this.setTcOut(true, roundFn(tc, 1 / this.fps, 0), 'tcout');
        }
      } else {
        this.setTcIn(true, roundFn(tc, 1 / this.fps, 0));
      }

    });

    this.__register();
  }

  @HostListener('window:keyup', ['$event'])
  up($event: KeyboardEvent) {
    // console.log("UP", $event.key)
    if ($event.key === 'Control' || $event.key === 'Meta') {
      this.ctrlKey = false;
    }

  }

  @HostListener('window:keydown', ['$event'])
  down($event: KeyboardEvent) {
    // console.log("dOWN", $event.key)
    if ($event.key === 'Control' || $event.key === 'Meta') {
      this.ctrlKey = true;
    }
  }

  @HostListener('window:keydown.i', ['$event'])
  keyTcin() {
    if (!this.keyboard) {
      return;
    }
    const cur = roundFn(this.currentTime, 1 / this.fps, 0);
    this.setTcIn(true, cur);
  }

  @HostListener('window:keydown.o', ['$event'])
  keyTcout() {
    if (!this.keyboard) {
      return;
    }
    const cur = roundFn(this.currentTime, 1 / this.fps, 0);
    this.setTcOut(true, cur);
  }

  @HostListener('window:keydown.delete', ['$event'])
  delete() {
    if (!this.keyboard || !this.selectedCut) {
      return;
    }
    if (this.mode !== 'tcin' && !this.selectedCut.idx) {
      this.restart();
    } else if (this.selectedCut.idx) {
      this.removeCut();
    }
  }


  //@HostListener('window:keydown.enter', ['$event'])
  add() {
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
    if (changes.cuts && changes.cuts.currentValue && changes.cuts.currentValue.length > 0) {
      this.composeStyles('cuts', this.cuts);
    }
    // if (changes.marks && changes.marks.currentValue && changes.marks.currentValue.length > 0) {
    //   this.composeStyles('marks', this.marks);
    // }
    if (changes.selected) {
      this.selectClip(null, changes.selected.currentValue, this.cuts, false);
    }
    if (changes.selectedMarker) {
      this.selectClip(null, changes.selectedMarker.currentValue, this.marks, false);
    }
    if (changes.playCut) {
      this.doubleClick(null, changes.playCut.currentValue, this.cuts);
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
      tcout: this.inposition + 10,
      type: this.cutType ? this.cutType : this.defaultCutType,
      selected: true,
      idx: ''
    }
  }

  private __select(idx: string | null = null, collection: ClipInterface[]): boolean {
    if (collection) {
      if (idx) {
        const index = collection.findIndex((cut: ClipInterface) => cut.idx === idx);
        if (index > -1) {
          if (this.__intervalTimeout) {
            clearInterval(this.__intervalTimeout);
          }
          // No lo actualiza dinámicamente
          const style = this.styles[collection === this.cuts ? 'cuts' : 'marks'][collection[index].idx];
          if (style) {
            style.border = '2px solid #fff';
          }
          if (collection === this.cuts) {
            this.selectedCut = collection[index];
            this.mode = 'tc';
            this.__askFrame = true;
          }
          this.seekVideo(collection[index].tcin / this.video.duration * 100, collection);
          return true;
        }
      } else {
        // No lo actualiza dinámicamente
        const selected = collection.find((cut: ClipInterface) => cut.selected);
        if (selected) {
          this.styles[collection === this.cuts ? 'cuts' : 'marks'][selected.idx].border = '';
          collection.forEach((cut: ClipInterface) => cut.selected = false);
        }
        this.selected = '';
      }
    }

    if (this.selectedCut && collection === this.cuts) {
      this.restart();
    }
  }

  /**
   * 
   * @param {MouseEvent} $event 
   * @param {string | null} idx 
   * @param {ClipInterface[]} collection 
   * @param {boolean} emit 
   */
  private __setClickTimeout($event: MouseEvent, idx: string | null = null, collection: ClipInterface[], emit: boolean) {
    // clear any existing timeout
    clearTimeout(this.__clickTimeout);
    this.__clickTimeout = setTimeout(() => {
      this.__clickTimeout = null;
      this.selectClip($event, idx, collection, emit);
    }, 200);
  }

  /**
   * Sets the tc input point
   * 
   * @param {boolean} update    if the selected value cut must be update
   */
  setTcIn(update = true, tcin?: number, mode?: string) {
    const prevTCin = this.currentTime;
    const cur = roundFn(this.currentTime, 1 / this.fps, 0);
    const inposition = this.tcinInput.value;
    this.inposition = tcin || cur || inposition;
    let created = false;
    if (!this.selectedCut) {
      this.selectedCut = this.__createEmptyCut();
      created = true;
    }
    if (update) {
      this.selectedCut.tcin = this.inposition;
      if (this.selectedCut.tcout && this.selectedCut.tcout < this.selectedCut.tcin) {
        this.selectedCut.tcout = this.selectedCut.tcin + prevTCin;
        if (this.selectedCut.tcout > this.video.duration) {
          this.selectedCut.tcout = this.video.duration;
        }
      }
      if (!tcin) {
        this.outposition = this.selectedCut.tcout;
        this.__lastthumb.idx = this.selectedCut.idx;
        this.posterChanged.emit(this.__lastthumb);
      }
      this.seekVideo(this.selectedCut.tcin / this.video.duration * 100, this.cuts, !tcin || this.inposition !== prevTCin);
    }
    if (!tcin) {
      if (this.mode === 'tcin') {
        mode = mode ? mode : 'tcout';
        this.selectedCut.selected = true;
        if (!this.selectedCut.idx) {
          this.cutEvent.emit({ type: 'tcin', cut: { ...this.selectedCut } });
        }
      }
    }
    this.mode = mode ? mode : 'tc';
    if (created) {
      this.setTcOut(false, this.selectedCut.tcout);
    }
    this.composeStyles('selected', [this.selectedCut]);
    // Si es una edición, es necesario también actualizar el "original"
    if (this.selectedCut.idx && ['cut', 'invalid'].indexOf(this.cutType) > -1) {
      this.composeStyles('cuts', [this.selectedCut], 'update')
    }
  }

  /**
   * Sets the tc output point
   */
  setTcOut(update = false, tcout?: number, mode?: string) {
    tcout = tcout || roundFn(this.video.currentTime, 1 / this.fps, 0);
    this.outposition = tcout;
    if (this.selectedCut) {
      this.selectedCut.tcout = tcout;
      this.mode = mode ? mode : 'tc';
      this.composeStyles('selected', [this.selectedCut]);
      // Si es una edición, es necesario también actualizar el "original"
      if (this.selectedCut.idx && ['cut', 'invalid'].indexOf(this.cutType) > -1) {
        this.composeStyles('cuts', [this.selectedCut], 'update')
      }
    }
    if (update) {
      this.seekVideo(tcout / this.video.duration * 100, this.cuts);
    }
  }

  /**
   * Restart selected cut
   */
  restart(emit = true) {
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
    if (['cut', 'invalid'].indexOf(this.cutType) > -1) {
      this.composeStyles('cuts', [this.selectedCut], 'update')
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
    this.selectedCut.tcout = this.tcoutInput.value;
    this.selectedCut.tcin = this.tcinInput.value;
    this.cutEvent.emit({ type: 'edit', cut: { ...this.selectedCut } });
    this.restart(false);
  }

  trackByIdx(_index: number, cut: { idx: string }): string {
    return cut.idx;
  }

  composeStyles(key: string, collection: ClipInterface[], update?: string) {
    if (!update) {
      this.styles[key as 'cuts' | 'marks' | 'selected'] = {};
    }
    if (collection) {
      collection.forEach((cut: ClipInterface) => {
        this.styles[key as 'cuts' | 'marks' | 'selected'][cut.idx || 'selected'] = <StyleInterface>{
          'left.px': this.getStartCut(cut.tcin),
          'width.px': this.getWidthCut(cut.tcin, cut.tcout),
          background: this.__bgs[cut.type],
          border: cut.selected ? '2px solid #fff' : ''
        }
      });
    }
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
   * Play current cut
   *
   * @param {MouseEvent}    $event
   * @param {string | null} idx
   */
  doubleClick($event: MouseEvent, idx: string | null = null, collection: ClipInterface[]) {
    if (this.__clickTimeout) {
      clearTimeout(this.__clickTimeout);
      this.__clickTimeout = null;
    }
    if ($event) {
      $event.stopPropagation();
    }
    if (!collection || this.ctrlKey) {
      return;
    }
    if (this.__select(idx, collection)) {
      this.video.play();
      const cut = collection.find((cut: ClipInterface) => cut.idx === idx);
      this.__intervalTimeout = setInterval(() => {
        if (this.currentTime >= cut.tcout) {
          this.video.pause();
          clearInterval(this.__intervalTimeout);
          this.__intervalTimeout = null;
        }
      }, 40);
    }
  }

  /**
   * Select / Deselect current cut
   * 
   * @param $event 
   * @param idx 
   * @param emit 
   */
  click($event: MouseEvent, idx: string | null = null, collection: ClipInterface[], emit = true) {
    if ($event) {
      $event.stopPropagation();
    }
    if (!collection || this.ctrlKey) {
      return;
    }
    this.__setClickTimeout($event, idx, collection, emit);
  }

  /**
   * Select / Deselect current cut
   * 
   * @param $event 
   * @param idx 
   * @param emit 
   */
  selectClip($event: MouseEvent, idx: string | null = null, collection: ClipInterface[], emit = true) {
    this.__select(idx, collection);
    const changeStyles = [this.curMinPercent, this.curMaxPercent];
    if (collection === this.cuts) {
      this.curMinPercent = 0;
      this.curMaxPercent = 100;
      const index = collection.findIndex((cut: ClipInterface) => cut.idx === idx);
      if (index > -1) {
        const tcin = collection[index].tcin;
        const tcout = collection[index].tcout;
        if (tcin > 0 && this.video.duration) {
          const min = Math.round(tcin * 100 / this.video.duration) - 10;
          if (min < 0) {
            this.curMinPercent = 0;
          } else {
            this.curMinPercent = min;
          }
        }
        if (tcout < this.video.duration) {
          const max = Math.round(tcout * 100 / this.video.duration) + 10;
          if (max > 100) {
            this.curMaxPercent = 100;
            //this.curMinPercent = (100 - max)
          } else {
            this.curMaxPercent = max;
          }
        }
        this.inposition = tcin;
        this.outposition = tcout;
      }
    }
    if (changeStyles[0] !== this.curMinPercent && changeStyles[1] !== this.curMaxPercent) {
      this.composeStyles('cuts', this.cuts);
      this.composeStyles('marks', this.marks);
    } else {
      // Cambiar el borde del seleccionado
      // this.composeStyles('marks', this.marks);
    }
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
    if (!this.trimmerBar || !this.__barWidth || !this.video.duration) {
      return 0;
    }
    this.__barWidth = this.trimmerBar.nativeElement.offsetWidth;
    if (tcout) {
      // Hacer media, es una marca
      tcin = tcin + (tcout - tcin) / 2;
    }
    const curPercent = (tcin / this.video.duration) * 100;
    return Math.round((curPercent - this.curMinPercent) * this.__barWidth / (this.curMaxPercent - this.curMinPercent));
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
    super.ngOnDestroy();
    this.__unsub();
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
  seekVideo(value: number, collection?: ClipInterface[], update = true): void {
    if (isNaN(value)) {
      return;
    }
    const percentage = value / 100;
    const newTime = this.video.duration * percentage;
    console.log("newTime", newTime)
    this.video.currentTime = newTime;
    if (!this.__lastthumb.thumb && collection == this.cuts) {
      this.__askFrame = true;
    }
    if (!update || !collection || collection.length === 0) {
      return;
    }
    const roundedTime = roundFn(this.video.currentTime, 1 / this.fps, 0);
    if (this.selectedCut && collection === this.cuts) {
      if (this.mode === 'tcin') {
        this.selectedCut.tcin = roundedTime;
        this.inposition = roundFn(this.selectedCut.tcin, 1 / this.fps, 0);
      } else if (this.mode === 'tcout') {
        this.selectedCut.tcout = roundedTime;
        if (!this.__focusedTimeout) {
          this.outposition = roundFn(this.selectedCut.tcout, 1 / this.fps, 0);
        }
      } else {
        if (!this.__focusedTimeout) {
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
   * @returns {string | null}
   */
  getFrame(): string | null {
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

  getVideoSize(event: {target: { videoWidth: number, videoHeight: number}}) {
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
    if (this.__focusedTimeout) {
      clearTimeout(this.__focusedTimeout);
    }
    // console.log("UP", event.key, input, this.tcoutInput.value)
    // if (!this.keyboard) {
    //   return;
    // }
    if (event.key === 'Enter') { // Solo numérico
      if (input === 'tcin') {
        const inposition = this.tcinInput.value;
        this.seekVideo(inposition / this.video.duration * 100, this.cuts);
        this.setTcIn(true, inposition);
        this.tcoutInput.focused = true;
        setTimeout(() => this.tcoutInput.mmInput.nativeElement.select(), 100);
        this.outposition = roundFn(this.video.currentTime, 1 / this.fps, 0);
      } else {
        // if (this.mode !== 'tcout') {
        //   this.setTcIn(false);
        // }
        this.outposition = this.tcoutInput.value;
        this.seekVideo(this.outposition / this.video.duration * 100, this.cuts);
        if (this.selectedCut) {
          this.setTcOut(true, this.outposition);
          if (this.selectedCut.idx) {
            this.editCut();
          } else {
            this.addCut();
          }
        }
      }
    } else {
      this.__focusedTimeout = setTimeout(() => {
        this.seekVideo((input == 'tcin' ? this.inposition : this.outposition) / this.video.duration * 100, this.cuts);
      }, 300);
    }
  }

  incr(input: string) {
    if (input === 'tcin') {
      this.inposition = roundFn(this.inposition + 1 / this.fps, 1 / this.fps, 0);
      if (this.inposition > this.video.duration) {
        this.inposition = this.video.duration;
      }
    }
  }

  decr(input: string) {
    if (input === 'tcin') {
      this.inposition = roundFn(this.inposition - 1 / this.fps, 1 / this.fps, 0);
      if (this.inposition < 0) {
        this.inposition = 0;
      }
    }
  }

}
