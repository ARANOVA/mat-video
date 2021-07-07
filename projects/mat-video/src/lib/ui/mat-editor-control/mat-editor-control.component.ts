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
} from "@angular/core";
import { ThemePalette } from "@angular/material/core";


import { EventHandler } from "../../interfaces/event-handler.interface";
import { EventService } from "../../services/event.service";

const countDecimals = function (value) {
  if (Math.floor(value) === value) {
    return 0;
  }
  return value.toString().split(".")[1].length || 0; 
}

const round = function(number, increment, offset) {
  const dec = 10 ** countDecimals(increment);
  return (Math.round(Math.round((number - offset) / increment ) * increment * dec) / dec) + offset;
}

const randomString = function(length: number) {
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

  curTimePercent = 0;

  @Input() video: HTMLVideoElement = null;

  @Input() fps: number = 25;

  @Input() color: ThemePalette = "accent";

  @Input() currentTime: number = 0;

  @Input() defaultCutType: string = 'cut';

  @Input() cutType: string | null = null;

  @Input() editorOrderButtons: HashNumber;

  @Output() currentTimeChanged = new EventEmitter<number>();

  @Input() cuts: any = [];

  @Input()
  get selected() {
    return this.selectedCut?.idx;
  }

  set selected(idx: string | undefined | null) {
    if (idx !== undefined && idx !== null) {
      this.selectCut(null, idx);
    }
  }

  @Output() cutEvent = new EventEmitter<any>();

  public selectedCut: {
    tcin: number,
    tcout: number,
    type: string,
    idx: string,
    selected?: boolean,
    thumb?: string
  } = {
    tcin: 0,
    tcout: 0,
    type: this.cutType ? this.cutType : this.defaultCutType,
    idx: ''
  };

  private events: EventHandler[];
  private fullWidth: number = 0;
  public mode: string = 'tcin';
  public imageURL: string;

  @ViewChild('trimmerBar') trimmerBar;
  
  constructor(
    private renderer: Renderer2,
    private evt: EventService
  ) { }

  ngAfterViewInit(): void {
    this.events = [
      { element: this.video, name: "seeking", callback: event => this.updateCurrentTime(this.video.currentTime), dispose: null },
      { element: this.video, name: "seeked", callback: event => { this.selectedCut.thumb = this.getFrame(this.video.currentTime)}, dispose: null },
      { element: this.video, name: "timeupdate", callback: event => this.updateCurrentTime(this.video.currentTime), dispose: null }
    ];
    this.fullWidth = this.trimmerBar.nativeElement.offsetWidth;
    this.evt.addEvents(this.renderer, this.events);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.defaultCutType || changes.cutType) {
      this.selectedCut.type = this.cutType ? this.cutType : this.defaultCutType;
    }
    if (changes.select && !changes.select.firstChange) {
      this.selectCut(null, changes.select.currentValue);
    }
    if (changes.cuts && changes.cuts.firstChange) {
      this.cuts.forEach((cut: any, idx: number) => {
        if (!cut.idx) {
          this.cuts[idx].idx = randomString(8);
        }
        /*
        TODO
        if (!cut.thumb) {
          this.seekVideo(cut.tcin / this.video.duration * 100);
          this.cuts[idx].thumb = this.getFrame(cut.tcin);
        }
        */
      });
      //this.seekVideo(0);
      this.cuts.sort((a, b) => a.tcin - b.tcin );
    }
  }

  setTcIn() {
    this.selectedCut.tcin = round(this.video.currentTime, 0.04, 0);
    this.mode = 'tcout';
    this.selectedCut.selected = true;
    if (!this.selectedCut.idx) {
      this.cuts.push(this.selectedCut);
    }
  }

  setTcOut() {
    this.selectedCut.tcout = round(this.video.currentTime, 0.04, 0);
    this.mode = 'tc';
  }

  resetCut(partial?: boolean) {
    if (!partial) {
      this.__removeCut('');
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

  private __removeCut(idx: string) {
    for (let i = this.cuts.length - 1; i >= 0; --i) {
      if (this.cuts[i].idx === idx) {
        this.cuts.splice(i, 1);
      }
    }
    this.cuts.sort((a, b) => a.tcin - b.tcin );
  }

  removeCut() {
    if (this.selectedCut.idx) {
      this.cutEvent.emit({type: 'remove', cut: {...this.selectedCut}});
      this.__removeCut(this.selectedCut.idx);
    }
    this.resetCut(true);
    this.mode = 'tc';
    this.selectedCut.tcin = 0;
  }

  addCut() {
    if (!this.selectedCut.idx) {
      this.__removeCut(this.selectedCut.idx);
    }
    this.selectedCut.selected = false;
    this.selectedCut.idx = randomString(8);
    this.cuts.push({...this.selectedCut});
    this.cuts.sort((a, b) => a.tcin - b.tcin );
    this.cutEvent.emit({type: 'add', cut: {...this.selectedCut}});
    this.resetCut(false);
  }

  getClassCut(cut) {
    const cls = [cut.type];
    if (cut.selected) {
      cls.push('selected');
    }
    if (cut.idx === -1) {
      cls.push('editing');
    }
    return cls;
  }

  editCut() {
    this.selectedCut.selected = false;
    this.cutEvent.emit({type: 'edit', cut: {...this.selectedCut}});
    this.mode = 'tc';
    this.deselectCut();
  }

  deselectCut($event?: MouseEvent) {
    if ($event) {
      $event.stopPropagation();
    }
    if (this.mode !== 'tcin' && this.mode !== 'tcout') {
      this.selectedCut.selected = false;
      const tcin = this.selectedCut.tcin;
      this.resetCut();
      this.selectedCut.tcin = tcin;
      this.mode = 'tcin';
    }
  }

  selectCut($event: MouseEvent, idx: string) {
    if ($event) {
      $event.stopPropagation();
    }
    this.cuts.forEach((cut: any) => {
      cut.selected = false;
    });
    this.cuts[idx].selected = true;
    this.selectedCut = this.cuts[idx];
    this.mode = 'tc';
    this.seekVideo(this.selectedCut.tcin / this.video.duration * 100);
    //setTimeout(() => this.mode = 'tcin', 200);
  }

  getStartCut(tcin: number): number {
    if (tcin > 0) {
      const l = (tcin / this.video.duration) * this.fullWidth;
      return l;
    }
  }

  getWidthCut(tcin: number, tcout: number): number {
    if (tcout < this.video.duration) {
      const w = (tcout / this.video.duration) * this.fullWidth;
      const l = (tcin / this.video.duration) * this.fullWidth;
      return Math.max(2, w - l);
    }
    return 2;
  }

  ngOnDestroy(): void {
    this.evt.removeEvents(this.events);
  }

  seekVideo(value: number): void {
    const percentage = value / 100;
    const newTime = this.video.duration * percentage;
    this.video.currentTime = newTime;
    if (this.mode === 'tcin') {
      this.selectedCut.tcin = round(this.video.currentTime, 0.04, 0);
    } else if (this.mode === 'tcout') {
      if (this.selectedCut.tcin > this.video.currentTime) {
        if (!this.selectedCut.tcout) {
          this.selectedCut.tcout = this.selectedCut.tcin;
        }
        this.selectedCut.tcin = round(this.video.currentTime, 0.04, 0);
      } else {
        this.selectedCut.tcout = round(this.video.currentTime, 0.04, 0);
      }
    }
  }

  getFrame(time: number): string {
    const canvas = document.createElement('canvas');
    canvas.width  = 500;
    canvas.height = 282;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0, 480, 270);
    return canvas.toDataURL();
  }

  updateCurrentTime(time: number): void {
    this.currentTime = time;
    this.curTimePercent = this.updateTime(this.currentTimeChanged, this.currentTime);
  }

  updateTime(emitter: EventEmitter<number>, time: number): number {
    emitter.emit(time);
    return (time / this.video.duration) * 100;
  }

}
