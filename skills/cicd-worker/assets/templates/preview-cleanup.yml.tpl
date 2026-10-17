name: Preview cleanup

# Deletes the Worker Preview(s) of a PR when the PR is closed or merged.
# Safety net: the docs only auto-delete the least recently used Preview at the plan limit.

on:
  pull_request:
    types: [closed]

permissions:
  contents: read

jobs:
  cleanup:
    name: Delete Preview
    if: github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    env:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      BRANCH: ${{ github.event.pull_request.head.ref }}
    steps:
      - uses: actions/checkout@v4
__SETUP_STEPS__
__DELETE_STEPS__
