# Add new visualization views

Follow the steps below to add a new visualization view / page.

## Step 1: Create visualization view folder and file
- Create a new folder in the `frontend/src/pages` directory. e.g. `frontend/src/pages/DemoView`
- Create an index.jsx file in the `frontend/src/pages/DemoView` directory. e.g. `frontend/src/pages/DemoView/index.jsx`

## Step 2: Customize visualization view content
- Write the visualization view code in the `frontend/src/pages/DemoView/index.jsx` file.
  - Your code will looks like this:
    ```jsx 
    import ...;
    function DemoView() {
        return (
            <div>
                <h1>Demo View</h1>
            </div>
        );
    }
    
    export default DemoView;
    ```
    - In this page you need to import and use the status storage variables.
## Step 3: Define status Store and API requests
- Use **zustand** to create a store and use it in the `DemoView` component.
    - To get the data from the backend, you need to create a status Store file in the `frontend/src/stores` directory. e.g. `frontend/src/stores/DemoViewStore.js`.
    - Define status variables and actions in the `DemoViewStore.js` file.
    - Write the data fetching logic in the `DemoViewStore.js` file (Import and call the API requests functions).
    - Save the data in the status variables.
- Define API requests in the `frontend/src/api` directory. e.g. `frontend/src/api/DemoViewApi.js`.
    - Use axios to send API requests to the backend endpoints.
    - e.g. 
```javascript
export const getDemoViewData = async (dataset,query_str) => {
    try {
        const response = await axios.get(`${BACKEND_API_URL}/getdemoviewdata`,
            {params: {dataset:dataset,query_str:query_str}});
        return response;
    } catch (error) {
        console.error("Error in getDemoViewData:", error);
        throw error;
    }
}
  
```
    - This above function needs to be imported and called in the `DemoViewStore.js` file.

## Step 4: Backend Routes
- Add backend API routes in the `backend/routes` directory. e.g. `backend/routes/demoview_routes.py`.
    - Write the request handler logics in the `backend/routes/demoview_routes.py` file.
    - Import and call the processing functions.
    - This file needs to be imported and configured in the FastAPI app in the `backend/main.py` file.
        - ```
          app.include_router(demoview_routes.router, prefix="/demoview")
          ```
- Add backend processing functions in the `backend/funcs` directory. e.g. `backend/funcs/demo_view.py`.
    - Write the processing functions in the `backend/funcs/demo_view.py` file.
    - Return the processed data to the request handler.

## Step 5: Test the new visualization view
- Run the project following the instructions in the [Install](../install/index.md) section.
- Access the new visualization view in the browser.
- Test the API requests and status storage variables.
 