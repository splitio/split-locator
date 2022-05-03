# Split Locator

Currently works with HTML/js code only.

## Inputs

Split Admin API Token, necessary for Split API use
Workspace ID, which can usually be copied from the URL when viewing a split in your workspace of choice

## Outputs

The filename, and line number of each reference to a split is inserted in the Split's description in the Split console.

## Example Usage

name: split-locator

on: [push]

jobs:
  split_locator_job:
    runs-on: ubuntu-latest
    name: A job to find splits
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      - name: Checkout
        uses: splitio/split-locator@0.95
      - name: Split Locator action step
        uses: splitio/split-locator@0.95 # Uses an action in the root directory
        id: sl
        with:
          adminApiToken: '<your split admin api key>'
          wsId: '<your split workspace id>'
          
