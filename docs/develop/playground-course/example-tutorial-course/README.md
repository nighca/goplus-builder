# Example Tutorial Course

This directory illustrates one Playground Course before its files are uploaded:

```text
example-tutorial-course/
├── index.json
├── main.gox
├── project/
│   ├── main.spx
│   ├── Lita.spx
│   ├── Mushroom.spx
│   └── assets/
│       ├── index.json
│       ├── backdrop.svg
│       └── sprites/
│           ├── Lita/
│           │   ├── index.json
│           │   └── default.svg
│           └── Mushroom/
│               ├── index.json
│               └── default.svg
└── assets/
    └── step-to.mp4
```

`index.json` is the Tutorial Class Framework configuration. It locates the embedded SPX project, supplies private Copilot context and selects the initial in-editor route.

`main.gox` is the conventional entry file for the Course-author-written XGo program. `project/` is an ordinary serialized SPX project that becomes an ownerless in-memory project while the learner works. The root `assets/` contains Course-local material addressed by the Tutorial program; the empty MP4 is only a format placeholder. It is independent of `project/assets/`, which belongs to the embedded SPX project.

After upload, `PlaygroundCourse.content` does not contain these file bodies directly. It contains a `FileCollection` whose keys are the relative paths shown here and whose values are universal URLs. Course APIs and PostgreSQL preserve that mapping without parsing this directory's internal contracts.

The files are intentionally small and focus on format and ownership boundaries rather than forming a production-ready lesson.
