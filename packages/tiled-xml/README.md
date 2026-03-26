# `@pixel-editor/tiled-xml`

Responsibility:

- parse `TMX` XML documents into typed, normalized adapter results
- serialize normalized map documents back into deterministic `TMX`
- parse and serialize `TSX` XML tileset documents through the shared `TSJ` normalization path
- reuse normalized `TMJ` import rules where possible instead of duplicating domain mapping logic
- surface unsupported or lossy XML input as explicit import issues
