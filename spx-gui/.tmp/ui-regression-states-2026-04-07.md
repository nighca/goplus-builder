# UI Regression State List

Generated: 2026-04-07
Scope: spx-gui route states, editor subroute states, and important non-route UI states that should be covered when validating large UI refactors or styling migrations.

## 1. Non-editor route states

Source: `src/router.ts`

### Community and account

- `/`
  - Home page
- `/explore`
  - Explore page
  - Variant: with `?o=<ExploreOrder>` ordering query
- `/search`
  - Search page
  - Variant: empty keyword
  - Variant: with search keyword query
- `/user/:nameInput`
  - User overview tab
- `/user/:nameInput/projects`
  - User projects tab
- `/user/:nameInput/likes`
  - User likes tab
- `/user/:nameInput/followers`
  - User followers tab
- `/user/:nameInput/following`
  - User following tab
- `/project/:ownerInput/:nameInput`
  - Project detail page

### Tutorials

- `/tutorials`
  - Tutorials index
- `/course/:courseSeriesIdInput/:courseIdInput/start`
  - Course start page
- `/course-series/:courseSeriesIdInput`
  - Course series page

### Auth and fallback

- `/sign-in/callback`
  - Sign-in callback page
- `/sign-in/token`
  - Sign-in token page
- `/:pathMatch(.*)*`
  - 404 page

### Redirect-only entries worth remembering during regression

- `/editor`
  - Redirects to `/`
- `/editor/:projectNameInput`
  - Redirects to signed-in user project editor route
- `/share/:owner/:name`
  - Redirects to project page route

## 2. Editor container states

Primary route source: `src/router.ts`
Container state source: `src/pages/editor/index.vue`
Selection and subroute source: `src/components/editor/editor-state.ts`

### Top-level editor route

- `/editor/:ownerNameInput/:projectNameInput/:inEditorPath*`
  - Loaded editor state

### Editor lifecycle variants

- Enter editor with `?publish`
  - Publish modal flow is triggered on mount
- Leave editor with dirty changes in effect-free mode
  - Leave-confirm dialog
- Open target project while another project has unsaved local cache
  - Confirm-open-target dialog

### Editor runtime and panel-layout states

Sources:
- `src/components/editor/runtime.ts`
- `src/components/editor/panels/EditorPanels.vue`
- `src/components/editor/preview/EditorPreview.vue`

- Runtime idle
- Runtime debug running
- Preview shown with normal panel layout
- Console panel shown in debug layout
- Preview fullscreen

## 3. Editor route-derived page states

### Route model summary

`EditorState` has two dimensions:

- Edit mode
  - `default`
  - `map`
- Selected target
  - `stage`
  - `sprite`

If edit mode is not `default`, the mode name is prefixed into the route before the selected target route.

Important note from current implementation:

- `map` mode currently reuses the same downstream route parser, so `map/stage/...` and `map/sprites/...` can both exist in route state even if the intended primary UI is the map editor.
- Legacy top-level `sounds/...` is still accepted and normalized internally to stage sounds.

### 3.1 Default mode stage states

Sources:
- `src/components/editor/stage/StageEditor.vue`
- `src/components/editor/stage/backdrop/BackdropsEditor.vue`
- `src/components/editor/stage/sound/sounds-editor-state.ts`
- `src/components/editor/stage/widget/WidgetsEditor.vue`

- `stage/code`
  - Stage code editor
- `stage/backdrops`
  - Stage backdrops view with current default backdrop selected if any
- `stage/backdrops/:backdropName`
  - Stage backdrops view focused on named backdrop
- `stage/sounds`
  - Stage sounds view with first sound auto-selected if available
- `stage/sounds/:soundName`
  - Stage sounds view focused on named sound
- `stage/widgets`
  - Stage widgets view with first widget auto-selected if available
- `stage/widgets/:widgetName`
  - Stage widgets view focused on named widget

### 3.2 Default mode sprite states

Sources:
- `src/components/editor/sprite/SpriteEditor.vue`
- `src/components/editor/sprite/CostumesEditor.vue`
- `src/components/editor/sprite/AnimationEditor.vue`

- `sprites`
  - Sprite route root; editor state will auto-select first sprite if sprites exist
- `sprites/:spriteName`
  - Sprite route root for named sprite; defaults to code tab when no subroute is provided
- `sprites/:spriteName/code`
  - Sprite code editor
- `sprites/:spriteName/costumes`
  - Costumes view with current default costume selected if any
- `sprites/:spriteName/costumes/:costumeName`
  - Costumes view focused on named costume
- `sprites/:spriteName/animations`
  - Animations view with first animation auto-selected if available
- `sprites/:spriteName/animations/:animationName`
  - Animations view focused on named animation

### 3.3 Map-prefixed editor states

Primary UI source:
- `src/components/editor/map-editor/MapEditor.vue`

Derived from `EditorState`, the following route shapes should be considered valid UI states during regression:

- `map/sprites`
- `map/sprites/:spriteName`
- `map/sprites/:spriteName/code`
- `map/sprites/:spriteName/costumes`
- `map/sprites/:spriteName/costumes/:costumeName`
- `map/sprites/:spriteName/animations`
- `map/sprites/:spriteName/animations/:animationName`
- `map/stage/code`
- `map/stage/backdrops`
- `map/stage/backdrops/:backdropName`
- `map/stage/sounds`
- `map/stage/sounds/:soundName`
- `map/stage/widgets`
- `map/stage/widgets/:widgetName`

These do not necessarily correspond to distinct visible layouts in every case, but they are distinct route states that can affect selection, breadcrumbs/history, highlighted tabs, and side-panel content.

### 3.4 Backward-compat route states

Handled in `src/components/editor/editor-state.ts`:

- `sounds`
- `sounds/:soundName`

These are interpreted as:

- `stage/sounds`
- `stage/sounds/:soundName`

## 4. Important non-route editor UI states

These do not have dedicated routes, but they change visible UI and should be covered by regression tests.

### Asset creation and import flows

Primary source: `src/components/asset/index.ts`

- Sprite generation modal
- Backdrop generation modal
- Asset library modal
- Save asset to library modal
- Asset library management modal
- Load from Scratch modal
- Image preprocess modal
  - Used by sprite import
  - Used by costume import
- Sound recorder modal
- Group costumes as animation modal

### Rename and destructive flows

Primary sources:
- `src/components/asset/index.ts`
- `src/components/editor/sprite/AnimationItem.vue`
- `src/components/editor/map-editor/SpriteBasicConfig.vue`
- `src/components/editor/code-editor/xgo-code-editor/ui/CodeEditorUI.vue`

- Rename sprite modal
- Rename sound modal
- Rename costume modal
- Rename backdrop modal
- Rename animation modal
- Rename widget modal
- Rename generated costume modal
- Rename generated animation modal
- Animation remove modal
- Sprite collision editor modal

### Editor list empty states

Sources:
- `src/components/editor/stage/widget/WidgetsEditor.vue`
- `src/components/editor/sprite/AnimationEditor.vue`

- Widgets empty state
- Animations empty state

### Editor navbar and command states

Sources:
- `src/components/editor/navbar/EditorNavbar.vue`
- `src/components/editor/history.ts`

- Project menu opened
- Project menu closed
- Undo available
- Undo unavailable
- Redo available
- Redo unavailable
- Saving pending
- Saving completed
- Saving failed

### Code editor interaction states

Likely source area:
- `src/components/editor/code-editor/**`

These should be treated as separate regression targets if the migration touched generic UI primitives:

- Diagnostics visible
- Hover tooltip visible
- Completion menu visible
- Rename flow launched from code editor

## 5. Important non-route non-editor UI states

### Project management flows

Source: `src/components/project/index.ts`

- Create project modal
- Open project modal
- Share project modal
- Modify project name warning modal
- Modify project name modal
- Publish project modal
- Published-success modal
- Remove project confirm dialog
- Unpublish project confirm dialog

### User profile/account flows

Sources:
- `src/components/community/user/index.ts`
- `src/components/community/user/UserHeader.vue`
- `src/components/community/user/EditProfileModal.vue`

- Modify username warning modal
- Modify username modal
- Edit profile modal
- Edit avatar modal

### Course-related flows

Sources:
- `src/components/course/index.ts`
- `src/components/tutorials/TutorialCourseSuccess.vue`

- Course management modal
- Course series management modal
- Tutorial course success modal

### Shared dialog primitives

Source: `src/components/ui/dialog/index.ts`

- Generic confirm dialog

## 6. Dynamic behaviors that matter for regression interpretation

### Auto-selection behaviors

Sources:
- `src/components/editor/editor-state.ts`
- `src/components/editor/stage/sound/sounds-editor-state.ts`
- `src/components/editor/stage/widget/WidgetsEditor.vue`
- `src/components/editor/sprite/AnimationEditor.vue`

- If a sprite route is active but no sprite is selected and sprites exist, the first sprite is auto-selected.
- Sounds view auto-selects the first sound when current selection becomes null.
- Widgets view auto-selects the first widget when current selection becomes null.
- Animations view auto-selects the first animation when current selection becomes null.

These are important because route-only coverage may miss the actual visible default selection.

### Name-driven selection

Most detail subroutes resolve by resource name, not by ID. For regression data setup, the test fixture must keep stable names for:

- Sprite
- Backdrop
- Sound
- Widget
- Costume
- Animation

## 7. Suggested first-pass regression matrix

If a full sweep is too expensive, start with these high-signal states:

- Home
- Explore with ordering query
- Search with results
- User profile overview
- Project detail page
- Stage code
- Stage backdrops with selected item
- Stage sounds with selected item
- Stage widgets empty state
- Sprite code
- Sprite costumes with selected item
- Sprite animations empty state
- Map editor with right config panel expanded
- Map editor with right config panel collapsed
- Preview idle
- Preview running
- Console/debug layout
- Asset library modal
- Sprite generation modal
- Project create modal
- Project publish modal
- Modify username modal

## 8. Source index

- `src/router.ts`
- `src/pages/editor/index.vue`
- `src/components/editor/editor-state.ts`
- `src/components/editor/stage/StageEditor.vue`
- `src/components/editor/stage/backdrop/BackdropsEditor.vue`
- `src/components/editor/stage/sound/sounds-editor-state.ts`
- `src/components/editor/stage/widget/WidgetsEditor.vue`
- `src/components/editor/sprite/SpriteEditor.vue`
- `src/components/editor/sprite/CostumesEditor.vue`
- `src/components/editor/sprite/AnimationEditor.vue`
- `src/components/editor/map-editor/MapEditor.vue`
- `src/components/asset/index.ts`
- `src/components/project/index.ts`
- `src/components/community/user/index.ts`
- `src/components/course/index.ts`