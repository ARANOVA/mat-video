# mat-video is an Angular video player using Material
[![npm version](https://badge.fury.io/js/mat-video.svg)](https://badge.fury.io/js/mat-video)
[![Build Status](https://travis-ci.org/ARANOVA/mat-video.svg?branch=master)](https://travis-ci.org/ARANOVA/mat-video)
[![Maintainability](https://api.codeclimate.com/v1/badges/46fb1a751d60d0f8b316/maintainability)](https://codeclimate.com/github/ARANOVA/mat-video/maintainability)

**mat-video** is an Angular component for playing videos. It has all the features you would expect from a standard video player, all in an extremely light package. The video player is designed to be flexible and easy to use; you can be up and running in less than 5 minutes!

It was built for modern browsers using _TypeScript_, _CSS3_ and _HTML5_ with _Angular & Material.

See the [changelog](https://github.com/ARANOVA/mat-video/blob/master/CHANGELOG.md) for recent changes.  

If you wish to contribute, please fill out the [pull request template](https://github.com/ARANOVA/mat-video/blob/master/CONTRIBUTING.md).  For issues, please fill out the [issue template](https://github.com/ARANOVA/mat-video/blob/master/ISSUE_TEMPLATE.md) before submitting.

## Features
- Native _HTML5_ video player
- Easy to use
- Play/Pause
- Seeking
- Volume
- Autoplay
- Preload
- Looping
- Scaling
- Fullscreen
- Download
- Buffering spinners
- Poster image
- Subtitles and text tracks
- Multiple media sources
- Customizable controls
- Material theming
- Keyboard shortcuts
- Fixed and responsive sizing
- Supports Chrome, Firefox, Safari, and Edge

## Installation
**mat-video** requires [Angular Material](https://material.angular.io/guide/getting-started) as a peer dependency, including animations and a theme.

```
ng add @angular/material
```

To use **mat-video** in your project install it via [npm](https://www.npmjs.com/package/mat-video):

```
npm install --save mat-video
```

Add the following to your module:

```typescript
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatVideoModule } from 'mat-video';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    MatVideoModule
  ],
})
export class AppModule { }
```

## Usage
A minimal example is quite simple, in your HTML file:

```html
    <app-mat-video src="localOrRemoteVideo.mp4"></app-mat-video>
```

A slightly more customized example, in your HTML file:

```html
    <app-mat-video title="My Tutorial Title" [autoplay]="true" [preload]="true" [fullscreen]="true" [download]="false" color="accent" spinner="spin" poster="image.jpg">
      <source matVideoSource src="tutorial.mp4" type="video/mp4">
      <source src="tutorial.webm" type="video/webm">
      <track matVideoTrack src="subtitles_en.vtt" kind="subtitles" srclang="en" label="English">
      <track src="subtitles_no.vtt" kind="subtitles" srclang="no" label="Norwegian">
    </app-mat-video>
```

## API
Attribute | Type | Description | Default
--- | --- | --- | ---
*src* | **string, MediaStream, MediaSource, Blob** | Path, URL, or `srcObject` for a video | *null*
*title* | **string** | Title for the video | *null*
*autoplay* | **boolean** | Whether the video should autoplay | *false*
*preload* | **boolean** | Whether the video should preload | *true*
*loop* | **boolean** | Whether the video should loop | *false*
*time* | **number** (two-way bindable) | Get or set the timestamp of the video | *0*
*muted* | **boolean** (two-way bindable) | Get or set whether the video is muted | *false*
*quality* | **boolean** | Whether the video will have a quality indicator | *true*
*download* | **boolean** | Whether the video will have a download option | *false*
*fullscreen* | **boolean** | Whether the video will have a fullscreen option | *true*
*playsinline* | **boolean** | Whether the video should play inline | *false*
*showFrameByFrame* | **boolean** | Whether the video will display frame-by-frame controls | *false*
*keyboard* | **boolean** | Whether the player will have keyboard shortcuts | *true*
*overlay* | **boolean** | Force the overlay/controls to be shown or hidden | *null*
*color* | **ThemePalette** | Material theme color palette for the sliders | *primary*
*spinner* | **string** | Use 'spin', 'dot', 'split-ring', 'hourglass', or pass your own buffering spinner class | *spin*
*poster* | **string** | Path or URL to a poster image | *null*

In addition, [source](https://www.w3schools.com/tags/tag_source.asp) and [track](https://www.w3schools.com/tags/tag_track.asp) elements are supported by **mat-video**.

The **_matVideoSource_** attribute can be used on the *source* tag to automatically reload the video when the source changes.

The **_matVideoTrack_** attribute can be used on the *track* tag to automatically reload the video when the track changes.

## Events
Listening to video events can be accomplished by directly accessing the video tag within **mat-video**.

In your HTML file:

```html
    <app-mat-video #video src="localOrRemoteVideo.mp4"></app-mat-video>
```

In your TS file:

```typescript
export class SampleComponent implements OnInit {
  @ViewChild('video') matVideo: MatVideoComponent;
  video: HTMLVideoElement;

  constructor(private renderer: Renderer2) { }

  ngOnInit(): void {
    this.video = this.matVideo.getVideoTag();

    // Use Angular renderer or addEventListener to listen for standard HTML5 video events
    
    this.renderer.listen(this.video, 'ended', () => console.log('video ended'));
    this.video.addEventListener('ended', () => console.log('video ended'));
  }
}
```

This API feature is considered experimental, and is subject to change.

## Compatibility
**mat-video** supports the last two major Angular versions.  Previous versions of **mat-video** support older versions of Angular.

mat-video Version | Angular Version
--- | ---
1.0.0 - 2.7.2 | Angular 5, 6, 7, 8
2.8.0 - 2.8.1 | Angular 8
2.9.0 - 2.9.0 | Angular 9
2.10.0+ | Angular 10


## Credits
**mat-video** is an open-source project developed by Nicholas Koehler. Contributed by [ARANOVA](https://aranova.es)

Special thanks:
- [mediapack-me](https://github.com/mediapack-me) for responsive assistance.
- [buu700](https://github.com/buu700) for several features and fixes.
- [fabiomartino](https://github.com/fabiomartino) for modernizing project structure.
