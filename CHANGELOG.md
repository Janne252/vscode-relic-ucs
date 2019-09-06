# Change Log

## [0.04] - 2019-09-06
- Improved user experience when processing large files (progress notification)
- Grouped diagnostics (identical "duplicate ID" and "duplicate message" are now grouped instead of highlighting all occurrences)
- Configuration options for controlling the reporting of warnings:
    `ucs.diagnostics.warnings.emptyMessage`, `ucs.diagnostics.warnings.duplicateMessage`, `ucs.diagnostics.warnings.emptyLine`
- `editor.insertSpaces` is now disabled by default for `ucs`

## [0.01] and [0.02] and [0.0.3] - 2019-09-02

- Initial release
	- Syntax highlighting
        - LocString ID
        - LocString message formatting parameters, e.g. `%1%` or `%1NAME%`
        - Automatically generated LocString references, e.g. `$1234 No Key`

    - Editor
        - `editor.insertSpaces` is disabled for `ucs` by default
        
    - Diagnostics
        - Errors:
            - Invalid LocString (no tab separator)
            - Missing LocString ID number
            - Invalid LocString ID (not an integer)
            - Duplicate LocString ID

        - Warnings:
            - Empty line (before end of file)
            - Empty LocString message
            - Duplicate LocString message

