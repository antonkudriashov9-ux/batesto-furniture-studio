# Original CAD reference

This assembly is original concept geometry, not Blum/Hettich data or certified hardware. CAD kernel: OCCT through CadQuery 2.6.1. Dimensions in Python/STEP are millimetres; browser mesh data is in metres. Regenerate with `python cad/build_reference.py --width 600` (450–1000 mm). Source dimensions are rebuilt through Boolean operations, not scaled meshes.

Output: named STEP solids (lossless ZIP download), GLB and tessellated browser geometry with part IDs. The browser currently exposes the 600 × 870 × 600 mm reference. The downloadable STEP/GLB are the original reference and do not include browser edits. Changes to finishes, placement and detail overrides are retained in project JSON. This is a first CAD-backed module, not a browser CAD kernel or a production drawing system.

Features: 358 individually selectable parts; rounded panel edges; aligned pilot and clearance bores with countersinks; 7 × 50 concept confirmats with swept helical threads and hex drives; handle screws with shafts, threads and cross recesses; captive rear panel and 8 mm drawer bottoms in routed grooves; 6 × 24 dowels; separate inner drawer fronts, spacers and mounting screws; hollow feet with plates, fasteners, spindles and elastomer pads; slotted nested channels, ball separators, 144 steel balls and elastomer stops. Each runner has fixed/middle/moving stages at 0/0.5/1 travel; separators and balls move at 0.25/0.75. Their travel is kinematic, not a rigid-body simulation.

Optical finishes distinguish brushed steel, chrome, satin zinc, matte ABS and rubber. Wood/stone use the existing licensed PBR scans with physical-size UVs and calibrated roughness. Polymer and zinc microtexture is procedural, not a measured manufacturer sample. Mipmapping filters fine detail at distance. Identical CAD solids share immutable browser position/normal/index buffers; each part keeps independent UVs and editable finishes.

No claim of load rating, complete mechanism clearance, standardized thread certification, or manufacturing readiness. The assembly does not include every commercial fitting: soft-close internals, hinges (this is a drawer cabinet), exact adjustment threads in feet, plinth clips and production edge-band machining remain outside this reference. Drill dimensions and fasteners require engineering validation before manufacture.

Official sources investigated:
- https://www.blum.com/eu/en/services/industrial-production/cad-cam-dataservice/
- https://www.hettich.com/fileadmin/Hettich_International/Service/Overview_CAD-Partner-2026_EN.pdf
- https://cadquery.readthedocs.io/en/latest/importexport.html
- https://gtv.com.pl/en/produkt/WK-CF0750-01/ (7 × 50 confirmat / hex drive reference, not imported geometry)
- https://ea.blum.com/en/building-a-movento-drawer/ (wooden-drawer construction context; this reference is not MOVENTO)

Manufacturer assets have NOT been redistributed. Verify the specific asset licence and model version before integrating them. The dependency environment is outside the site checkout in `work/cad-env`; it is not deployed.
