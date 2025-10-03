# Customize a Home Page for Your Project

Follow the steps below to customize the home page which fits your own use case.

## Step 1: Create home page folder and file
- Create a new folder in the `frontend/src/pages` directory. e.g. `frontend/src/pages/DemoHome`
- Create an index.jsx file in the `frontend/src/pages/DemoHome` directory. e.g. `frontend/src/pages/DemoHome/index.jsx`


## Step 2: Customize home page content
- We have provided a default home page in the `frontend/src/pages/Home` directory. You can copy the content from it and modify it to fit your own use case.
- At this stage you can  modify the numbers of datasets, samples, and features to fit your own use case.
- TODO: Automatically obtain the numbers of datasets, samples, and features from the backend is under development.

## Step 3: Configure the .env file
- Modify the content of the `fontend/env/.env` file to point to your own home page.
- The content of the `fontend/env/.env` file should be like this:
```bash
# title
VITE_APP_TITLE = Demo Project

# home page view options, fill the folder name of the home page here
VITE_HOME_PAGE = DemoHome

# runnning port, for running locally in development mode
VITE_PORT = 3000
```

## Step 4: Run the project
- Run the project following the instructions in the [Install](../install/index.md) section.

