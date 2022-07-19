# Split Locator

Currently works with HTML/js code only.

## Inputs

Split Admin API Token, necessary for Split API use
Workspace ID, which can usually be copied from the URL when viewing a split in your workspace of choice

## Outputs

The filename, and line number of each reference to a split is inserted in the Split's description in the Split console.

## Example Usage
```
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
        uses: splitio/split-locator@1.2.0
      - name: Split Locator action step
        uses: splitio/split-locator@1.2.0 # Uses an action in the root directory 
        id: sl
      # Use the output from the action step  
      - name: Get output splits
        run: echo "sl ${{ steps.sl.outputs.splits }}"
      - name: Modify value # Tried to modify the files based on existing testfile.txt
        run: |
          echo "${{ steps.sl.outputs.splits }}" >> report.html
      - name: move to dir # Move the generated files into output folder
        run: |
          rm -fR output
          mkdir -p output
          yes| cp -rf report.html ./output/
      - name: Commit files # commit the output folder
        run: |
          git config --local user.email "david.martin@split.io"
          git config --local user.name "GitHub Action Report Test"
          git add ./output
          git commit -m "add report"
      - name: Push changes # push the output folder to your repo
        uses: ad-m/github-push-action@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          force: true        
```
