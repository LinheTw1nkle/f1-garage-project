# ShapesSlideshow / Demo 1

Team entry layout and circle/vertical slideshow transitions are adapted from
Codrops ShapesSlideshow `src/js/demo1/slideshow.js`, `src/js/slide.js` and
`src/css/base.css`: https://github.com/codrops/ShapesSlideshow
Arrow navigation is replaced by one-slide-per-wheel-gesture navigation,
with touch, keyboard, animation locking and scoped teardown.
All photographs and fonts are existing F1 Garage assets.

MIT License

Copyright (c) 2009 - 2021 [Codrops](https://tympanus.net/codrops)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## GSAP 3.10.4

Local, unmodified distribution files from the GSAP 3.10.4 release:
https://github.com/greensock/GSAP/tree/3.10.4/dist

Copyright 2022, GreenSock. All rights reserved.
Original license notices are retained in each distribution file.
Subject to https://greensock.com/standard-license or the agreement issued with
a Club GreenSock membership. These files are not covered by the Codrops MIT license.

# GridLayoutMotion

Driver overview motion is adapted from Codrops' GridLayoutMotion `js/demo.js`
and `css/base.css`: https://github.com/codrops/GridLayoutMotion

The original animation code carries the following notice:

Copyright (c) 2018 Codrops

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The repository's resource terms also apply:
https://github.com/codrops/GridLayoutMotion#license
The integrated work uses F1 Garage's existing image and font assets; no demo
photographs or bundled third-party animation libraries are redistributed.

## Ferrari team entry photographs

Official Formula 1 photographs, including the 2026 British Grand Prix podium.
Asset URLs, page sources and original captions are recorded in
`img/team-editorial/ferrari/sources.json`. Photography is not covered by the
Codrops MIT license. Photographs are displayed with CSS cropping and masks.


## Scroll-driven scenes

The race stroke drawing and driver story scroll follow the Lenis + GSAP
ScrollTrigger scrub approach explained by Matt Sequeira in:
https://github.com/mattseq/how-to-scrollytell
https://github.com/mattseq/how-to-scrollytell/blob/master/src/GsapAnims.jsx
The Garage controllers are independently implemented for its nested scroll regions;
the React application, media and components are not redistributed.

Lenis 1.3.17: https://github.com/darkroomengineering/lenis (MIT).
The full license is retained in `js/vendor/LENIS-LICENSE.txt`.
GSAP ScrollTrigger 3.10.4 matches the existing GSAP core version; the original
copyright and license notice is retained in `js/vendor/ScrollTrigger.min.js`.


## Draggable Image Strip photo gallery

Adapted from Codrops DraggableImageStrip (2019):
https://github.com/codrops/DraggableImageStrip
https://tympanus.net/Development/DraggableImageStrip/
The image layout, lerp drag model, image scales, opacity and image timeline
order, durations, easings and random staggering are retained. Number links,
cover text and preview copy are removed. GSAP 3 equivalents are used for the
original TweenMax/TimelineMax image tweens. Only F1 Garage photo assets are used.
The original resource terms are documented in its README:
https://github.com/codrops/DraggableImageStrip#license

The adapted demo.js is licensed under the MIT license:

MIT License

Copyright (c) 2019 Codrops

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Draggabilly PACKAGED v2.2.0 by Dave DeSandro / Metafizzy is distributed under
its MIT license. The original packaged distribution and license notices are
retained in js/vendor/draggabilly.pkgd.min.js.
https://github.com/desandro/draggabilly/tree/v2.2.0


## Codrops ButtonHoverStyles — Skoll

Source: https://github.com/codrops/ButtonHoverStyles

The Garage return/close controls adapt the Skoll circular-cover slide and two-stage icon animation. Colors, dimensions and icon contents are adapted to this project. MIT license; Copyright (c) 2009 - 2021 Codrops. The MIT permission and disclaimer reproduced above also apply to this adaptation.


## Tyre scroll presentation reference

Motion and scene sequencing reference: Dieg0arc/3D-scrolling-practice
https://github.com/Dieg0arc/3D-scrolling-practice

The marquee, circular reveal, scroll-driven full rotation and feature-reveal sequence were studied from script.js, style.css and index.html. Garage implements that choreography with its existing GSAP distribution and WebGL tyre renderer, scoped to a stationary presentation stage with its own wheel, touch and keyboard animation controls. No model, font, image or source file from that repository is redistributed.
