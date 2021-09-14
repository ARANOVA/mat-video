import { formatNumber } from '@angular/common';
import { Component, VERSION } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import buildInfo from './../../package.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  version = VERSION.full;
  appversion: string = buildInfo.version;

  ngclass = 'mat-video-responsive';

  src = 'assets/NASA.mp4';
  // src = 'https://firebasestorage.googleapis.com/v0/b/r9---flyfut---dev.appspot.com/o/test-1%2Flow_1622632163798%7C1622632168355%7C1622632172696%7C1622632177082.mp4?alt=media&token=12e71b0f-e735-4f15-b6cc-87935b5e514b';
  title = 'NASA Rocket Launch';
  width = 600;
  height = 337.5;
  currentTime = 0;
  autoplay = false;
  preload = 'metadata';
  loop = false;
  quality = false;
  download = false;
  fullscreen = true;
  playsinline = false;
  showFrameByFrame = true;
  controlClass = 'no-float';
  headerClass = 'nodisplay';
  sliderClass = 'nodisplay';
  keyboard = true;
  color = 'primary';
  spinner = 'spin';
  poster = 'assets/NASA.jpg';
  overlay = true;
  muted = false;
  showSpeed = true;
  showVolume = true;
  playingState = false;
  editor = true;
  editorButtons = true;
  orderConfiguration = {
    playButton: 0,
    frameByFrameControl: 1,
    volumeControl: 2,
    timeControl: 4,
    speedControl: 6,
    spacer: 5,
    qualityControl: 6,
    downloadButton: 7,
    fullscreenButton: 8
  };
  editorOrderButtons = {
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

  marks = [
    {tcin: 1, tcout: 20, type: 'mark', idx: '222', selected: false, thumb: undefined},
    {tcin: 25, type: 'mark', idx: '22222222', selected: false, thumb: undefined},
  ];

  cuts = [
      {tcin: 10, tcout: 20, type: 'invalid', idx: '2', selected: false, thumb: undefined},
      {tcin: 25, tcout: 27, type: 'mark', idx: '2222', selected: false, thumb: undefined},
      {tcin: 55, tcout: 58, type: 'audio', idx: '22222', selected: false, thumb: undefined},
      {tcin: 45, tcout: 50, type: 'cut', idx: '1', selected: false}
  ];

  initialcuts = this.cuts.map((cut: any) => { return {...cut} });

  defaultCutType = 'invalid';
  cutType = 'cut';

  selected = null;
  selectedMark = null;
  playCut = null;
  speedScale: number[] = [0.5, 0.75, 1, 1.25, 1.5, 3, 5, 6];
  speedIndex: number = 0;

  form: FormGroup;

  errors: [];

  editing;
  constructor() {
    this.editing = {
      match: {
        localTeam: {
          name: 'test'
        },
        visitorTeam: {
          name: 'test2'
        }
      }
    };
    this.form = new FormGroup({
      metadata: new FormGroup({
        type: new FormControl(),
        initiatingTeam: new FormControl(),
        tcin: new FormControl(),
      })
    });
    this.form.patchValue({metadata: { tcin: 10.4 } })
  }

  private __remove(idx: string): boolean {
    const index = this.cuts.findIndex((cut: any) => cut.idx === idx);
    if (index > -1) {
      this.cuts.splice(index, 1);
    }
    return (index > -1);
  }

  cutEvent($event: any) {
    console.log('CUT EVENT', $event);
    if ($event.type === 'add') {
      this.cuts.push({...$event.cut});
      this.cuts.sort((a, b) => a.tcin - b.tcin);
    } else if ($event.type === 'tcin') {
      //this.cuts.push({...$event.cut});
    } else if ($event.type === 'restart') {
      // Eliminar el que no tenga id
      this.__remove('');
    } else if ($event.type === 'remove') {
      if (this.__remove($event.cut.idx)) {
        this.selected = null;
      }
    } else if ($event.type === 'edit') {

    }
  }

  posterChanged($event: {thumb: string, idx: string | null}) {
    console.log("posterChanged", $event.idx)
    if ($event.idx === null) {
      this.poster = $event.thumb;
    } else if ($event.idx === '') {
      //this.selected
    } else {
      // Es un cut
      const found = this.cuts.find((c) => c.idx === $event.idx)
      if (found) {
        found.thumb = $event.thumb;
      }
    }
  }

  durationChanged($event: number) {
    console.log("DURATION:", $event);
  }

  deleteClip(cutidx: string): void {
    console.log("deleteClip", cutidx)
    if (cutidx) {
        const idx = this.cuts.findIndex((cut: any) => {
            return cut.idx === cutidx;
        });
        if (idx > -1) {
            this.cuts.splice(idx, 1);
        }
        console.log(idx, this.cuts);
    }
  }

  selectedChanged($event: string | null, update: boolean = false) {
    console.log("selectedChanged");
    this.cuts.forEach((cut: any, i: number) => {
      console.log("selectedChanged", $event, cut.idx, cut.idx == $event);
      if (cut.idx == $event) {
        this.cuts[i].selected = true;
        if (update) {
          this.selected = i;
        }
      } else {
        cut.selected = false;
      }
    });
  }

  selectedMarkChanged($event: string | null, update: boolean = false) {
    console.log("selectedMarkChanged APP");
    this.marks.forEach((cut: any, i: number) => {
      console.log("selectedMarkChanged", $event, cut.idx, cut.idx == $event);
      if (cut.idx == $event) {
        this.marks[i].selected = true;
        if (update) {
          this.selectedMark = i;
        }
      } else {
        cut.selected = false;
      }
    });
  }

  deSelect() {
    this.selected = null;
    this.cuts.forEach((cut: any) => {
      cut.selected = false;
    });
  }

  selectCut($event: MouseEvent, idx: number) {
    this.cuts.forEach((cut: any, i: number) => {
      cut.selected = idx === i;
    });
    // "Emit" selected
    setTimeout(() => this.selected = this.cuts[idx].idx, 0);
  }

  selectMark($event: MouseEvent, idx: number) {
    this.marks.forEach((cut: any, i: number) => {
      cut.selected = idx === i;
    });
    // "Emit" selected
    setTimeout(() => this.selectedMark = this.marks[idx].idx, 0);
  }


  /**
   * Play current cut
   * 
   * @param $event 
   * @param idx 
   * @param emit 
   */
   doubleClick($event: MouseEvent, cutidx: string | null = null) {
    if ($event) {
      $event.stopPropagation();
    }
    const idx = this.cuts.findIndex((cut: any) => {
      return cut.idx === cutidx;
    });
    if (idx > -1) {
      // "Emit" double click
      setTimeout(() => this.playCut = this.cuts[idx].idx, 0);
    }
  }

  playEvent($event: boolean) {
    this.playingState = $event;
  }

  checkCutOrNot($: any) {
    return true;
  }

  /*
     * Returns duration in seconds
     *
     * @param Object cut
     * @returns number
    */
  getDuration(cut: { tcout: number; tcin: number; }) {
    return Math.round(cut.tcout - cut.tcin);
  }

  getVideoTitle(video: any, force: boolean = false) {
      if (!video.title || video.title.startsWith('gen:') || force) {
          return `${video.type == 'cut' ? 'Corte' : video.type == 'audio' ? 'Narración' : 'Descarte'} de ` +
              `${formatNumber(video.tcin, 'es', '2.2-2')} a ` +
              `${formatNumber(video.tcout, 'es', '2.2-2')} ` +
              `(${formatNumber(this.getDuration(video), 'es', '0.0-2')} segundos)`;
      }
      return video.title;
  }

}
