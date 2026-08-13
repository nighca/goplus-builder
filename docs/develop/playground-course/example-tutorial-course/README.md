# Example Tutorial Course

This directory illustrates one Playground Course before its files are uploaded:

```text
example-tutorial-course/
├── index.json
├── tutorial/
│   └── main.gox
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
└── resources/
    └── step-to.svg
```

`index.json` is the Tutorial Class Framework configuration. It locates the embedded SPX project and Tutorial entry, supplies private Copilot context and selects the initial editor composition.

`tutorial/` contains the Course-author-written XGo program. `project/` is an ordinary serialized SPX project that becomes an ownerless in-memory project while the learner works. `resources/` contains Course-local material addressed by the Tutorial program.

After upload, `PlaygroundCourse.content` does not contain these file bodies directly. It contains a `FileCollection` whose keys are the relative paths shown here and whose values are universal URLs. Course APIs and PostgreSQL preserve that mapping without parsing this directory's internal contracts.

The files are intentionally small and focus on format and ownership boundaries rather than forming a production-ready lesson.
