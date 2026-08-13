# Course storage

## Goals

Course storage supports two Course kinds without mixing their content schemas:

- `guided`: an entrypoint and a Copilot prompt.
- `playground`: an embedded project, Tutorial program, local files, Copilot context and editor configuration.

A Course Series contains courses of exactly one kind. This design does not introduce draft/published revisions, persisted runtime sessions or unfinished-course progress.

## Tables

### `course`

Stores fields shared by both Course kinds.

| Column       | Type          | Constraint                         |
| ------------ | ------------- | ---------------------------------- |
| `id`         | `bigint`      | Primary key                        |
| `created_at` | `timestamptz` | Not null                           |
| `updated_at` | `timestamptz` | Not null                           |
| `owner_id`   | `bigint`      | Not null, foreign key to `user.id` |
| `kind`       | `text`        | Not null, `guided` or `playground` |
| `title`      | `text`        | Not null                           |
| `thumbnail`  | `text`        | Not null, universal URL            |

`kind` is immutable after creation. An index on `(kind, id)` supports kind-filtered administration queries.

### `guided_course`

Stores the content of a Guided Course.

| Column       | Type     | Constraint                                                 |
| ------------ | -------- | ---------------------------------------------------------- |
| `course_id`  | `bigint` | Primary key, foreign key to `course.id`, cascade on delete |
| `entrypoint` | `text`   | Not null                                                   |
| `prompt`     | `text`   | Not null                                                   |

There is exactly one `guided_course` row for every `course.kind = 'guided'` row.

### `playground_course`

Stores the content of a Playground Course.

| Column            | Type     | Constraint                                                 |
| ----------------- | -------- | ---------------------------------------------------------- |
| `course_id`       | `bigint` | Primary key, foreign key to `course.id`, cascade on delete |
| `project_type`    | `text`   | Not null; initially only `spx`                             |
| `project_files`   | `jsonb`  | Not null, file path to universal URL                       |
| `program_entry`   | `text`   | Not null                                                   |
| `program_files`   | `jsonb`  | Not null, file path to universal URL                       |
| `local_files`     | `jsonb`  | Not null, file path to universal URL                       |
| `copilot_context` | `text`   | Not null                                                   |
| `editor`          | `jsonb`  | Not null, standard or Simple Mode configuration            |

The stored file collections reference the existing file service and Kodo objects. The Course row owns those references, but the binary objects are not stored in PostgreSQL.

The `editor` value follows this shape:

```json
{ "kind": "standard" }
```

or:

```json
{ "kind": "simple", "spriteName": "Lita" }
```

### `course_series`

The existing table keeps its metadata and ordered `course_ids` collection, with one added column:

| Column | Type   | Constraint                         |
| ------ | ------ | ---------------------------------- |
| `kind` | `text` | Not null, `guided` or `playground` |

## Write transactions and invariants

Creating a Course writes `course` and the matching content table in one transaction. Updating a Course locks the common row and updates only the content table selected by its immutable kind. Deleting the common row cascades to its content row.

The controller guarantees that exactly one matching content row exists. This invariant spans tables and is therefore maintained by the write transaction rather than by nullable columns in one table.

Creating or updating a Course Series follows the existing course-locking order:

1. Normalize, sort and deduplicate the requested Course IDs.
2. Lock the referenced `course` rows in ID order.
3. Verify that every Course exists.
4. Verify that every Course kind equals `course_series.kind`.
5. Lock the Course Series row when updating it.
6. Write `course_ids` and other Series fields.

This prevents a Course deletion or concurrent Series update from invalidating the kind check between validation and write.

## Migration from the current schema

All existing courses are Guided Courses, so migration can be deterministic:

1. Create `guided_course` and `playground_course`.
2. Add `course.kind` as non-null with temporary default `guided`.
3. Copy every existing `course.entrypoint` and `course.prompt` into `guided_course`.
4. Add `course_series.kind` as non-null with temporary default `guided`.
5. Remove `entrypoint` and `prompt` from `course` after the application reads from `guided_course`.
6. Remove the temporary defaults if Course creation must always provide kind explicitly.

No Course IDs or Course Series ordering changes during migration.
