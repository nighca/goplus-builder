# UI Regression Findings

Generated: 2026-04-07
Comparison baseline:

- Local migrated version: `http://localhost:5173`
- Staging pre-migration version: `https://goplus-builder.qiniu.io/`

## Confirmed differences

1. Global top navigation background differs across multiple routes.
   - States observed: `/`, `/project/nighca/hello-world`, `/tutorials`, `/editor/nighca/hello-world/...`
   - Local: flat solid turquoise top navigation background.
   - Staging: turquoise top navigation background with large decorative circular pattern overlays.
   - Impact: global chrome is not pixel-identical across multiple pages, so the migrated UI diverges consistently from staging at the app-shell level.
   - Evidence:
     - Local screenshot: `.tmp/regression-home-local.png`
     - Staging screenshot: `.tmp/regression-home-staging.png`
     - Local screenshot: `.tmp/project-detail-page-local-2026-04-07.png`
     - Staging screenshot: `.tmp/project-detail-page-staging-2026-04-07.png`
     - Local screenshot: `.tmp/tutorials-index-local-2026-04-07.png`
     - Staging screenshot: `.tmp/tutorials-index-staging-2026-04-07.png`

2. Course start page tutorial content differs.
   - State: `/course/16/18/start` entered from `/tutorials` -> `XBuilder 使用` -> `创建项目`.
   - Local: the course start overlay shows different copy, including no `欢迎来到本次课程！🎉` heading and different step/instruction text such as `在这个课程中，我们将学习如何创建一个新项目` and `请将鼠标悬停在导航栏的 项目菜单 上，然后选择“创建项目”。`
   - Staging: the same course start overlay shows `欢迎来到本次课程！🎉` and different instructional copy such as `在这节课中，我们将学习如何创建一个新项目` and `请点击顶部导航栏中的 项目菜单，然后选择“创建项目”选项。`
   - Impact: users see different onboarding instructions and copy for the same course start state, so the tutorial experience is not consistent between local and staging.
   - Evidence:
     - Local screenshot: `.tmp/course-start-page-local.png`
     - Staging screenshot: `.tmp/course-start-page-staging.png`

3. Course series page visuals differ.
   - State: `/course-series/6` entered from `/tutorials` -> `Basics`.
   - Local: the top navigation uses a flat turquoise background, and the course-series cover placeholder uses a different light grid/gear illustration.
   - Staging: the top navigation includes the large circular decorative background pattern, and the course-series cover placeholder uses a book-themed illustration.
   - Impact: the course series page is visually inconsistent with staging at the global chrome and hero-card level, so users see a noticeably different presentation for the same series.
   - Evidence:
     - Local screenshot: `.tmp/course-series-page-local.png`
     - Staging screenshot: `.tmp/course-series-page-staging.png`

4. Project detail preview/player area renders differently.
   - State: `/project/nighca/hello-world`
   - Local: the preview/player area on the left appears heavily blurred and low-detail.
   - Staging: the same preview/player area renders sharply, with sprite/text details clearly visible.
   - Impact: the main visual focus area of the project detail page is not pixel-identical.
   - Evidence:
     - Local screenshot: `.tmp/project-detail-page-local-2026-04-07-check-2.png`
     - Staging screenshot: `.tmp/project-detail-page-staging-2026-04-07-check.png`

5. Project detail statistics differ between environments.
   - States observed: `/project/nighca/hello-world`, `/share/nighca/hello-world` redirect target, and `/project/nighca/test-publish`.
   - Local: the first stats value near the eye icon is lower than staging for the same project page state, for example `10` vs `11` on `hello-world`, and `0` vs `1` on `test-publish`.
   - Staging: the same stats value is higher for the same project page state.
   - Impact: comparison on project pages is affected by an apparent environment data mismatch, so not every difference on those pages can be attributed purely to styling.
   - Evidence:
     - Local screenshot: `.tmp/share-redirect-local-2026-04-07.png`
     - Staging screenshot: `.tmp/share-redirect-staging-2026-04-07.png`
     - Local screenshot: `.tmp/share-project-local-modal.png`
     - Staging screenshot: `.tmp/share-project-staging-modal.png`

6. Asset library management modal header layout differs.
   - State: asset library management modal opened from profile menu via `Manage sprites`.
   - Local: the modal title is rendered as a narrow vertical stacked label on the far left, and the search box spans almost the full modal width.
   - Staging: the title is rendered as a normal horizontal heading at the top-left, and the search box is a smaller right-aligned field.
   - Impact: modal chrome/layout is visibly inconsistent even though the asset list content matches.
   - Evidence:
     - Local screenshot: `.tmp/asset-library-management-local-2026-04-07.png`
     - Staging screenshot: `.tmp/asset-library-management-staging-2026-04-07.png`

7. Edit profile modal avatar edit trigger differs.
   - State: edit profile modal opened on the signed-in user's profile page.
   - Local: the avatar edit trigger is much smaller and sits farther down/right on the avatar.
   - Staging: the avatar edit trigger is larger and overlaps the avatar more prominently.
   - Impact: the main affordance for avatar editing is visually inconsistent in size and placement.
   - Evidence:
     - Local screenshot: `.tmp/edit-profile-modal-local-2026-04-07.png`
     - Staging screenshot: `.tmp/edit-profile-modal-staging-2026-04-07.png`

8. Code editor hover tooltip content diverges.
   - State: code editor hover on existing API symbol `onMsg` at `/editor/nighca/issue-reg/stage/code`.
   - Local: the hover tooltip is populated, showing description text such as `收到指定的广播消息时执行` and an `解释` button.
   - Staging: only an empty Monaco hover shell is shown after hover retries, without the populated content.
   - Impact: code intelligence/help UX is inconsistent between the migrated UI and staging.
   - Evidence:
     - Local screenshot: `.tmp/hover-tooltip-local-2026-04-07.png`
     - Staging screenshot: `.tmp/hover-tooltip-staging-2026-04-07.png`