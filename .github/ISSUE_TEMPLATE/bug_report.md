name: Bug Report
description: Report a bug or issue
title: "[BUG]: "
labels: ["bug"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thanks for reporting a bug! Please fill out the form below to help us understand and fix the issue.

  - type: textarea
    id: description
    attributes:
      label: Describe the bug
      description: A clear and concise description of what the bug is.
      placeholder: When I do X, Y happens instead of Z
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      description: Steps to reproduce the behavior
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. Scroll down to '...'
        4. See error
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
      description: A clear and concise description of what you expected to happen.
    validations:
      required: true

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots or logs
      description: If applicable, add screenshots or logs to help explain your problem.

  - type: input
    id: version
    attributes:
      label: Version
      description: What version are you running?
      placeholder: "0.1.0"
    validations:
      required: true

  - type: dropdown
    id: browser
    attributes:
      label: Browser (if applicable)
      options:
        - Chrome
        - Firefox
        - Safari
        - Edge
        - Other
    validations:
      required: false

  - type: textarea
    id: additional
    attributes:
      label: Additional context
      description: Add any other context about the problem here.
