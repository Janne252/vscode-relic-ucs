# relic-ucs

Support for Relic Entertainment's `.ucs` file format.

### Formatting

- Automatically convert inserted spaces (when `editor.insertSpaces` is enabled) into a tab if inserted after an integer, e.g. 
^`1234    ` (where ^ denotes the beginning of the line)

# Linting / diagnostics
- Errors:
    - Invalid LocString (no tab separator)
    - Missing LocString ID number
    - Invalid LocString ID (not an integer)
    - Duplicate LocString ID

- Warnings:
    - Empty line (before end of file)
    - Empty LocString message
    - Duplicate LocString message
