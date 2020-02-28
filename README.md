# UCS (Relic Entertainment's Localization file format)

Language Support for Relic Entertainment's `.ucs` localization files. Known games that use `*.ucs` files for localization are:
 - Homeworld (series)
 - Company of Heroes (series)
 - Dawn of War (series)

 _some may no longer be property of Relic Entertainment_.

### Syntax highlighting
- LocString ID
- LocString message formatting parameters, e.g. `%1%` or `%1NAME%`
- Automatically generated LocString references, e.g. `$1234 No Key`

### Formatting
- `editor.insertSpaces` is disabled by default for `*.ucs` files
    This can be adjusted with the language-specific setting in a `settings.json` file:
    ```json
    {
        "[ucs]": {
            "editor.insertSpaces": true
        }
    }
    ```

### Linting / diagnostics
- Errors:
    - Invalid LocString (no tab separator)
    - Missing LocString ID number
    - Invalid LocString ID (not an integer)
    - Duplicate LocString ID

- Warnings:
    - Empty line (before end of file)
    - Empty LocString message
    - Duplicate LocString message
