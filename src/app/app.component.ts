import { Component, VERSION } from "@angular/core";
import buildInfo from "./../../package.json";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  version = VERSION.full;
  appversion: string = buildInfo.version;

  ngclass = "mat-video-responsive";

  src = "assets/NASA.mp4";
  title = "NASA Rocket Launch";
  width = 600;
  height = 337.5;
  currentTime = 0;
  autoplay = false;
  preload = true;
  loop = false;
  quality = false;
  download = false;
  fullscreen = false;
  playsinline = false;
  showFrameByFrame = true;
  controlClass = 'no-float';
  headerClass = 'nodisplay';
  sliderClass = 'nodisplay';
  keyboard = true;
  color = "primary";
  spinner = "spin";
  poster = "assets/NASA.jpg";
  overlay = true;
  muted = false;
  showSpeed = true;
  showVolume = false;
  editor = true;
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

  cuts = [
      {tcin: 20, tcout: 40, type: 'invalid'},
      {tcin: 45, tcout: 50, type: 'cut'},
  ];

  selected = null;


  cutEvent($event: any) {
    console.log("CUT EVENT", $event);
  }
}
