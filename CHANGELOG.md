# Change Log


## [0.01] and [0.02] - 2019-09-02

- Initial release
	- Syntax highlighting
        - LocString ID
        - LocString message formatting parameters, e.g. `%1%` or `%1NAME%`
        - Automatically generated LocString references, e.g. `$1234 No Key`

    - Formatting
        - Automatically convert inserted spaces (when `editor.insertSpaces` is enabled) into a tab if inserted after an integer, e.g. 
        ^`1234    ` (where ^ denotes the beginning of the line)
        
    - Linting
        - Errors:
            - Invalid LocString (no tab separator)
            - Missing LocString ID number
            - Invalid LocString ID (not an integer)
            - Duplicate LocString ID

        - Warnings:
            - Empty line (before end of file)
            - Empty LocString message
            - Duplicate LocString message

