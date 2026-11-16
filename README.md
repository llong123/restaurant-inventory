# Stockroom

A small, standalone restaurant inventory app. Add item names and quantities, then create a clean PDF report to share with the kitchen team.

## Run locally

```sh
npm install
npm run dev
```

Build the production site with `npm run build`. Inventory drafts are saved in the current browser only; creating a report downloads a PDF and does not send data to a server.

## Deploy to GitHub Pages

The included GitHub Actions workflow builds the app and deploys it to Pages whenever `main` is updated. Create a GitHub repository for this project, push the `main` branch, then open the repository's **Settings → Pages** and set the build source to **GitHub Actions**. The first workflow run will publish the site at `https://<github-username>.github.io/<repository-name>/`.

When using a work machine with both personal and work GitHub accounts, authenticate the GitHub CLI for the personal account in this terminal with `gh auth login --hostname github.com --git-protocol https --web`. If `gh` already has a work account configured, choose **Login with a web browser** and make sure to authorize the personal account in the browser. Check the active account with `gh auth status` before creating or pushing a personal repository. For Git commits in this project, set identity locally (not globally) with `git config user.name "Your Name"` and `git config user.email "your-personal-email@example.com"`.
