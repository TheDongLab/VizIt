# Customize an About Page for Your Project

The about page is configurable in the same way as the [home page](customize_home.md).
Follow the steps below to customize it for your own deployment.

## Step 1: Create about page folder and file
- Create a new folder in the `frontend/src/pages` directory. e.g. `frontend/src/pages/DemoAbout`
- Create an index.jsx file in the `frontend/src/pages/DemoAbout` directory. e.g. `frontend/src/pages/DemoAbout/index.jsx`

## Step 2: Customize about page content
- We have provided a default about page in the `frontend/src/pages/About` directory, and the BrainDataPortal
  one in `frontend/src/pages/About_PD5D`. You can copy the content (including `About.css`) from either of them
  and modify it to fit your own use case.
- Typical things to change: the project description, the team and contributors, funding and acknowledgments,
  and how to cite your resource.

## Step 3: Configure the .env file
- Modify the content of the `frontend/env/.env` file to point to your own about page.
- The content of the `frontend/env/.env` file should be like this:
```bash
# title
VITE_APP_TITLE = Demo Project

# home page view options, fill the folder name of the home page here
VITE_HOME_PAGE = DemoHome

# about page view options, fill the folder name of the about page here
VITE_ABOUT_PAGE = DemoAbout

# runnning port, for running locally in development mode
VITE_PORT = 3000
```
- If `VITE_ABOUT_PAGE` is unset or points to a folder that does not exist, the portal falls back to the
  default page in `frontend/src/pages/About`.

## Step 4: Run the project
- Run the project following the instructions in the [Install](../install/index.md) section.
