# UI Regression Checklist

Generated: 2026-04-07
Based on: `.tmp/ui-regression-states-2026-04-07.md`

## 0. Common test setup

- Use local dev server for `spx-gui`.
- Prefer signing in as `nighca`.
- Prefer using an existing project with relatively complete assets, such as `nighca/hello-world`, for editor route coverage.
- Be careful with editor auto-save. If a test requires editing project content, restore the project state before leaving.
- For states that require owner-only actions, make sure the opened project belongs to the signed-in user.

## 1. Non-editor route regression

### Community and account

- [x] Home
  - Enter: open `/`.
- [x] Explore
  - Enter: open `/explore`.
- [x] Explore with ordering query
  - Enter: open `/explore?o=<some-valid-order>`.
  - Tip: the exact `o` value can be copied from existing UI interactions if needed.
- [x] Search empty state
  - Enter: open `/search`.
- [x] Search with keyword/results
  - Enter: open `/search?<searchKeywordQueryParamName>=<keyword>` or search from the header search UI.
- [x] User overview
  - Enter: open `/user/<name>`.
- [x] User projects
  - Enter: open `/user/<name>/projects`.
- [x] User likes
  - Enter: open `/user/<name>/likes`.
- [x] User followers
  - Enter: open `/user/<name>/followers`.
- [x] User following
  - Enter: open `/user/<name>/following`.
- [x] Project detail page
  - Enter: open `/project/<owner>/<name>`.

### Tutorials

- [x] Tutorials index
  - Enter: open `/tutorials`.
- [x] Course start page
  - Enter: open `/course/<courseSeriesId>/<courseId>/start`.
  - Tip: if valid IDs are not obvious, enter from the tutorials UI by clicking an existing course card instead of hard-coding the route.
- [x] Course series page
  - Enter: open `/course-series/<courseSeriesId>`.
  - Tip: if valid IDs are not obvious, enter from the tutorials UI by clicking an existing course series card.

### Auth and fallback

- [ ] Sign-in callback page shell
  - Enter: open `/sign-in/callback`.
  - Tip: this is mainly a smoke check for page layout. Full behavior depends on callback parameters.
- [ ] Sign-in token page shell
  - Enter: open `/sign-in/token`.
- [x] 404 page
  - Enter: open any non-existing route, for example `/not-found-regression-check`.

### Redirect behaviors

- [x] `/editor` redirect
  - Enter: open `/editor` and verify it redirects to `/`.
- [x] `/editor/:projectNameInput` redirect
  - Enter: while signed in, open `/editor/<your-project-name>` and verify it redirects to `/editor/<signed-in-user>/<project-name>`.
- [x] `/share/:owner/:name` redirect
  - Enter: open `/share/<owner>/<name>` and verify it redirects to the matching project page.

## 2. Editor route regression

### Editor container and lifecycle

- [x] Editor loaded shell
  - Enter: open `/editor/<owner>/<project>/<inEditorPath>` with any valid editor path, for example `/editor/nighca/hello-world/stage/code`.
- [x] Publish-on-entry flow
  - Enter: open `/editor/<owner>/<project>?publish`.
  - Tip: use an owner-owned project while signed in as that owner, otherwise publish actions may be unavailable.
- [ ] Leave editor confirm dialog with unsaved effect-free changes
  - Enter: make a change that stays dirty without completing auto-save, then navigate away.
  - Tip: this one is not fully obvious from the UI and may require using a mode/action path that keeps `EditingMode.EffectFree`; if not easy to reproduce reliably, defer it behind more stable route and modal checks.
- [ ] Open-target-with-another-in-cache confirm dialog
  - Enter: create unsaved cached changes in project A, then try opening project B.
  - Tip: the simplest route is usually: open one project, make local changes, then use the project open flow to switch to another project.

### Default mode stage routes

- [x] Stage code
  - Enter: open `/editor/<owner>/<project>/stage/code`.
  - Tip: you can also click Stage, then the `Code` tab.
- [x] Stage backdrops
  - Enter: open `/editor/<owner>/<project>/stage/backdrops`.
  - Tip: you can also click Stage, then `Backdrops`.
- [x] Stage backdrops with named selection
  - Enter: open `/editor/<owner>/<project>/stage/backdrops/<backdropName>`.
  - Tip: if the backdrop name is not obvious, first open the backdrops list and copy an existing item name.
- [x] Stage sounds
  - Enter: open `/editor/<owner>/<project>/stage/sounds`.
- [x] Stage sounds with named selection
  - Enter: open `/editor/<owner>/<project>/stage/sounds/<soundName>`.
  - Tip: as above, first inspect an existing sound name if needed.
- [x] Stage widgets
  - Enter: open `/editor/<owner>/<project>/stage/widgets`.
- [x] Stage widgets with named selection
  - Enter: open `/editor/<owner>/<project>/stage/widgets/<widgetName>`.
  - Tip: use a project that already has widgets, otherwise this falls into the empty state instead.

### Default mode sprite routes

- [x] Sprite route root with auto-selected first sprite
  - Enter: open `/editor/<owner>/<project>/sprites`.
  - Tip: use a project that already has at least one sprite.
- [x] Sprite route root for named sprite
  - Enter: open `/editor/<owner>/<project>/sprites/<spriteName>`.
- [x] Sprite code
  - Enter: open `/editor/<owner>/<project>/sprites/<spriteName>/code`.
- [x] Sprite costumes
  - Enter: open `/editor/<owner>/<project>/sprites/<spriteName>/costumes`.
- [x] Sprite costumes with named selection
  - Enter: open `/editor/<owner>/<project>/sprites/<spriteName>/costumes/<costumeName>`.
- [x] Sprite animations
  - Enter: open `/editor/<owner>/<project>/sprites/<spriteName>/animations`.
- [x] Sprite animations with named selection
  - Enter: open `/editor/<owner>/<project>/sprites/<spriteName>/animations/<animationName>`.
  - Tip: use a sprite that already has animations, otherwise this becomes the empty state.

### Map mode routes

- [x] Map mode sprite root
  - Enter: open `/editor/<owner>/<project>/map/sprites`.
  - Tip: you can also enter any editor page and switch to map mode from the top mode switcher.
- [x] Map mode named sprite
  - Enter: open `/editor/<owner>/<project>/map/sprites/<spriteName>`.
- [x] Map mode sprite code
  - Enter: open `/editor/<owner>/<project>/map/sprites/<spriteName>/code`.
- [x] Map mode sprite costumes
  - Enter: open `/editor/<owner>/<project>/map/sprites/<spriteName>/costumes`.
- [x] Map mode sprite costumes with named selection
  - Enter: open `/editor/<owner>/<project>/map/sprites/<spriteName>/costumes/<costumeName>`.
- [x] Map mode sprite animations
  - Enter: open `/editor/<owner>/<project>/map/sprites/<spriteName>/animations`.
- [x] Map mode sprite animations with named selection
  - Enter: open `/editor/<owner>/<project>/map/sprites/<spriteName>/animations/<animationName>`.
- [x] Map mode stage code
  - Enter: open `/editor/<owner>/<project>/map/stage/code`.
- [x] Map mode stage backdrops
  - Enter: open `/editor/<owner>/<project>/map/stage/backdrops`.
- [x] Map mode stage backdrops with named selection
  - Enter: open `/editor/<owner>/<project>/map/stage/backdrops/<backdropName>`.
- [x] Map mode stage sounds
  - Enter: open `/editor/<owner>/<project>/map/stage/sounds`.
- [x] Map mode stage sounds with named selection
  - Enter: open `/editor/<owner>/<project>/map/stage/sounds/<soundName>`.
- [x] Map mode stage widgets
  - Enter: open `/editor/<owner>/<project>/map/stage/widgets`.
- [x] Map mode stage widgets with named selection
  - Enter: open `/editor/<owner>/<project>/map/stage/widgets/<widgetName>`.

### Backward-compat routes

- [x] Legacy `sounds`
  - Enter: open `/editor/<owner>/<project>/sounds`.
  - Verify: it should land in the same visible state as stage sounds.
- [x] Legacy `sounds/:soundName`
  - Enter: open `/editor/<owner>/<project>/sounds/<soundName>`.
  - Verify: it should land in the same visible state as stage sounds with named selection.

## 3. Editor runtime and layout regression

- [x] Runtime idle with normal preview layout
  - Enter: open any editor route and do not run the project.
- [x] Runtime debug running
  - Enter: click `Run` in the preview panel.
- [x] Console/debug layout
  - Enter: after project starts running, verify the right-side panel area switches to console.
- [x] Preview fullscreen
  - Enter: run the project, then click the fullscreen button in the preview controls.
- [x] Map editor right config expanded
  - Enter: switch to map mode and keep the `Global Config` card expanded.
- [x] Map editor right config collapsed
  - Enter: switch to map mode and click the double-arrow icon in `Global Config` to collapse it.

## 4. Non-route editor UI regression

### Asset and import flows

- [x] Sprite generation modal
  - Enter: in the sprite panel, use the add menu and choose `Generate with AI`.
- [x] Backdrop generation modal
  - Enter: go to stage backdrops, open the add menu, choose `Generate with AI`.
- [x] Asset library modal
  - Enter: use an `Add from asset library` entry, for example from the sprite panel, backdrop panel, or sound add menu.
- [ ] Save asset to library modal
  - Enter: from an asset detail or item action, use the save-to-library entry.
  - Tip: if this action is not easy to find from the current fixture, defer until we hit a page where the save action is visible.
- [x] Asset library management modal
  - Enter: open the top-right profile dropdown, then choose `Manage sprites`, `Manage sounds`, or `Manage backdrops`.
- [ ] Load from Scratch modal
  - Enter: open the editor project menu, then click `Import assets from Scratch...`.
- [ ] Image preprocess modal for sprite import
  - Enter: in the sprite panel add menu, choose local file import for a sprite image.
- [ ] Image preprocess modal for costume import
  - Enter: in a sprite costumes page, choose `Select local file`.
- [x] Sound recorder modal
  - Enter: in stage sounds or animation sound editor, open the add menu and choose recording.
- [x] Group costumes as animation modal
  - Enter: open a sprite `Animations` tab and choose `Group costumes as animation`.

### Rename and destructive flows

- [x] Rename sprite modal
  - Enter: open a sprite item context action from the sprite list or map sprite config.
- [x] Rename sound modal
  - Enter: open a sound item or sound detail action in stage sounds.
- [x] Rename costume modal
  - Enter: open a costume item or costume detail action in sprite costumes.
- [x] Rename backdrop modal
  - Enter: open a backdrop item or backdrop detail action in stage backdrops.
- [x] Rename animation modal
  - Enter: open an animation item or animation detail action in sprite animations.
- [x] Rename widget modal
  - Enter: open a widget item or widget detail action in stage widgets.
- [x] Rename flow launched from code editor
  - Enter: use a code-editor resource rename entry instead of list/detail action.
  - Tip: keep this separate from ordinary rename modal checks because the trigger path is different.
- [x] Animation remove modal
  - Enter: open animation item actions and choose remove.
- [x] Sprite collision editor modal
  - Enter: switch to map mode, select a sprite, open sprite basic config, then enter collision editing.

### Empty states and command states

- [x] Widgets empty state
  - Enter: use a project with no stage widgets and open `stage/widgets`.
- [ ] Animations empty state
  - Enter: use a sprite with no animations and open its `animations` tab.
- [x] Project menu opened
  - Enter: click the top-left file/project menu in the editor navbar.
- [x] Project menu closed
  - Enter: open the same menu, then close it by clicking elsewhere.
- [x] Undo unavailable
  - Enter: open a fresh editor state before making changes.
- [x] Undo available
  - Enter: make one reversible project change, for example switch default backdrop or reorder an item.
- [x] Redo unavailable
  - Enter: open a fresh editor state or after making a new action without undoing.
- [x] Redo available
  - Enter: make a change, click undo, then verify redo becomes available.
- [ ] Saving pending
  - Enter: make a change in an auto-save path and observe the pending-save icon.
  - Tip: this state can still be short-lived. Treat it as lower stability than ordinary route and modal checks.
- [x] Saving completed
  - Enter: wait for auto-save to settle after a normal project change.
- [ ] Saving failed
  - Enter: simulate offline or save failure while dirty.
  - Tip: this is harder to force reliably in automation and may be better as a lower-priority manual scenario.

### Code editor UI states

- [x] Diagnostics visible
  - Enter: add a known-invalid identifier in code, wait briefly for diagnostics, then verify the error UI appears.
  - Tip: restore the original code afterward because editor changes auto-save.
- [x] Hover tooltip visible
  - Enter: hover a known API symbol such as `say` in the code editor.
  - Tip: this is one of the flakier MCP checks. Use it only after the editor is fully loaded.
- [x] Completion menu visible
  - Enter: focus the editor, move cursor to a place where completion is valid, then type a trigger character.

## 5. Non-route non-editor UI regression

### Project management flows

- [x] Create project modal
  - Enter: click `New project...` from the global navbar or from an empty project section.
- [x] Open project modal
  - Enter: click `Open project...` from the global navbar or editor project menu.
- [x] Share project modal
  - Enter: open a project page you can manage, then click the share action.
- [x] Modify project name warning modal
  - Enter: in the editor project menu, click `Modify project name`.
- [x] Modify project name modal
  - Enter: confirm the warning modal from the previous step.
- [x] Publish project modal
  - Enter: in the editor project menu or preview area, click `Publish project...`.
- [x] Published-success modal
  - Enter: complete the publish flow.
- [x] Remove project confirm dialog
  - Enter: in the editor project menu, click `Remove project...`.
- [x] Unpublish project confirm dialog
  - Enter: use a project that is already public, then click `Unpublish project` from the editor project menu.

### User profile and account flows

- [x] Edit profile modal
  - Enter: open your own user page and click `Edit profile`.
- [x] Edit avatar modal
  - Enter: inside `Edit profile`, use the avatar edit entry.
- [x] Modify username warning modal
  - Enter: open your own user page, then click the username edit icon if shown.
  - Tip: this button is only shown when username modification is enabled for the current context.
- [x] Modify username modal
  - Enter: confirm the warning modal from the previous step.

### Course-related flows

- [x] Course management modal
  - Enter: open the top-right profile dropdown and click `Manage courses`.
  - Tip: this entry only appears for users with `canManageCourses` capability.
- [x] Course series management modal
  - Enter: open the top-right profile dropdown and click `Manage course series`.
  - Tip: same capability requirement as above.
- [ ] Tutorial course success modal
  - Enter: complete a tutorial course flow until the success modal is shown.
  - Tip: this is not a direct route entry and is better treated as a later manual or scripted scenario once the core route checks are done.

### Shared dialog primitive

- [x] Generic confirm dialog
  - Enter: trigger any confirm-based action, such as remove project, unpublish project, or import project file overwrite.

## 6. Suggested execution order

If we want a practical run order instead of a raw list, use this order:

1. Non-editor routes.
2. Core editor routes in default mode.
3. Map mode layout and route checks.
4. High-signal editor modals: asset library, sprite generation, backdrop generation, publish, rename.
5. Runtime checks: run, console layout, fullscreen.
6. Lower-stability checks: diagnostics, hover, saving pending, save failure, tutorial success.