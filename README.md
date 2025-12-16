You are a senior Three.js developer with strong spatial design and system architecture skills.

Build a Web 3D educational application using Three.js with a CLEAN, WELL-PLANNED URBAN THEME combined with greenery.

IMPORTANT:
- DO NOT create or design any 3D assets.
- ALL assets must be loaded dynamically by scanning the `/models` folder.
- Assume all assets are low-poly `.glb` or `.gltf`.
- Do NOT hardcode asset filenames.

ASSET LOADING RULES (STRICT):
- Scan `/models` directory
- Load all `.glb` / `.gltf` files
- Classify assets by filename keywords:
  - contains `road` → road asset
  - contains `sidewalk` → sidewalk
  - contains `building` → building
  - contains `tree` → greenery
  - contains `bench`, `prop`, `lamp` → decoration
- If asset role is unclear, treat as decorative prop

VISUAL STYLE:
- Low-poly
- Modern educational city
- Clean layout
- Calm color palette
- Performance-friendly

URBAN LAYOUT RULES (MANDATORY):
- One main straight road
- Sidewalks on both sides
- Buildings placed symmetrically left & right
- Equal spacing between buildings
- Trees aligned along sidewalks
- Small green zones between buildings
- NO random placement
- NO overlapping assets

PLAYER & CAMERA:
- FPS-style movement (PointerLockControls)
- WASD + mouse look
- Camera height ~1.6
- Player constrained to walkable areas
- Prevent walking through buildings and props
- No gravity or falling

CHECKPOINT SYSTEM:
- Each building is a learning checkpoint
- Create an invisible trigger zone in front of each building
- Each checkpoint has:
  - topic name (derived from building index)
  - YouTube video ID (placeholder variable)

CHECKPOINT BEHAVIOR:
- On entering checkpoint:
  - Pause movement
  - Unlock pointer
  - Show HTML learning popup

LEARNING POPUP:
- HTML overlay above canvas
- Shows:
  - Math topic title
  - Embedded YouTube video
  - Continue button
- Continue enabled only after:
  - Video ends OR
  - Minimum watch time threshold

PROJECT STRUCTURE (STRICT):
/src
  assetLoader.js        // scan & load models
  scene.js
  player.js
  environment.js
  buildings.js
  checkpoints.js
  ui.js
  youtube.js
  main.js

CODING RULES:
- Use modern Three.js ES modules
- Modular, readable code
- One responsibility per file
- Comment only critical logic
- No deprecated APIs

TASK SCOPE (IMPORTANT):
Implement ONLY:
1. Asset scanning & dynamic loading from `/models`
2. Scene setup (camera, light, renderer)
3. Clean urban layout using detected assets
4. Player walking system

STOP after completing these tasks and wait for next instruction.
