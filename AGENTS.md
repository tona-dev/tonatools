## Overview

This extension is primarly focused to work with the Palette feature (Cmd + shift + p in Mac) it helps the users to achieve tasks while keeping their hands on the keyboard.

## Architecture

This is a VSCodex extension following a feature slice approach.

- Features are groupped by "category"
- Spot shared abstractions over creating new code
- Every feature needs to be documented in README.md
- Tests should pass
- Use bumpy to:
  - Update CHANGELOG
  - Version bump
  - Do not use `publish` command

## Tagging

- For tag names use `v0.0.0` as template, then use package.json version (avoid repeated)

## Creating a release

- Name `v0.0.0 {optional: Human title}"
