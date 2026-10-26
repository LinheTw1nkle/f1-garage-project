# Top seven frontal helmet cutouts

Completed: Antonelli, Russell, Hamilton, Verstappen, Leclerc, Norris, Piastri.
These are transparent PNG cutouts made from photographed/rendered replica product imagery. They are not represented as photographs of race-used helmets. Original source links and source types are listed in top-seven-sources.json. Remaining drivers are postponed at the user's request. Website code has not been changed.

Method: built-in image_gen background extraction; one edit request per helmet. Inspected on white and dark navy backgrounds. Original source photographs are kept in sources/.

Base prompt:
Use case: background-extraction. Edit target is the supplied front-facing helmet photo. Precisely cut out ONLY the existing helmet onto real transparent alpha. Remove plain background, floor/table and ALL external cast/drop shadows. Keep the exact original frontal perspective, silhouette, vents, clear aerodynamic top pieces, visor reflections, colors, logos and lettering; do not redesign or add anything. Retain opaque white helmet areas and entire black bottom rim. Smooth clean antialiased contour with no white fringe, dark outline, fuzzy halo, stray pixels or cropped protrusions. Center with modest transparent padding. One isolated helmet PNG, no text outside helmet.

Additional constraints for individual assets: background/shop mark outside the object is excluded; no glow or floor shadow; alpha zero outside helmet; do not invent sponsor details.
