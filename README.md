# The Toolkit

Quickly spin up and get working on your next Chrome extension! The Toolkit contains:

- React.js v18
- The Wunderkind Design System component library
- Pre-configured ESLint and Prettier files
- Pre-commit hooks
- Use Typescript or vanilla JS
- If using Typescript, Chrome @types are included

## Usage

1. Ensure you have access to the `@frontend` group on Gitlab, as the Wunderkind Design System is a dependency
2. Configure your SSH keys, here's a [great primer from Github](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
3. Configure your access tokens in Gitlab. You'll want `api`, `read_respository`, `write_repository`, `read_registry`, `write_registry`. Set the expiry a year from now
4. Clone the repo via SSH: `git clone git@gitlab.bouncex.net:uxe/scavenger-hunt.git`
5. Set up a `.npmrc` file

```
@frontend:registry=https://gitlab.bouncex.net/api/v4/packages/npm/

# Add the token for the scoped packages URL. This will allow you to download
//gitlab.bouncex.net/api/v4/packages/npm/:_authToken=[YOUR ACCESS TOKEN HERE]

# Add token for uploading to the registry. Replace componentlibraryexploration
//gitlab.bouncex.net/api/v4/projects/458/packages/npm/:_authToken=[YOUR ACCESS TOKEN HERE]
```

6. Run `npm i`

### Other commands

| Command           | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| **npm run build** | Run builds                                                            |
| **npm run start** | Run in dev mode, includes hot reloading                               |
| **npm run ship**  | Build and zip up extension ready for upload to Chrome Extension store |

## Development

All files are included to begin with -- remove or add more to suit your project.

### background.ts

Chrome describes this as the service worker, and is often used to handle the logic of an extension.

### devtools.ts

Can access everything background.ts can, plus it can access the Devtools and Debugger APIs.

### DevtoolsPanel.tsx

This is the UI, or the view, for a Devtools panel.

### content.ts

The content script

### popup.tsx

The popup view. It's preconfigured to include instructions for accessing DevTools.

### ErrorToast.tsx

An component to display error handling. Includes a variable to plug in your own Google Form.
