import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import {Suspense, lazy} from 'react';

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import About from "./pages/About";
import DatasetsPage from "./pages/Datasets";
import SamplesPage from "./pages/Samples";
import NotFoundPage from "./pages/NotFound";

// import Analysis from "./pages/Analysis";
import Login from "./pages/Login/Login.jsx";
// import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Test from "./pages/Test";
import UnauthorizedPage from "./pages/Unauthorized/index.jsx";
import {Bounce, ToastContainer} from "react-toastify";
import GeneView from "./pages/GeneView/index.jsx";
import VisiumView from "./pages/VisiumView";
import XQTLView from "./pages/XQTLView";
import GenomicRegionView from "./pages/GenomicRegionView";
import XDatasetsView from "./pages/XDatasets";
import CellTypesView from "./pages/CellTypesView";
import ViewsHome from "./pages/ViewsHome";
import DatasetManagePage from "./pages/DatasetManage";
import LayerView from "./pages/LayerView/index.jsx";
import HowToUse from "./pages/Help/HowToUse.jsx";
import FAQPage from "./pages/Help/FAQ.jsx";
import RESTAPIPage from "./pages/Help/RESTAPI.jsx";
import DatasetDemosPage from "./pages/DatasetDemos/index.jsx";
import XQTLDemo from "./pages/DatasetDemos/XQTLDemo.jsx";
import SingleCellDemo from "./pages/DatasetDemos/SingleCellDemo.jsx";
import VisiumSTDemo from "./pages/DatasetDemos/VisiumSTDemo.jsx";
import ClustersView from "./pages/ClustersView/index.jsx";

const DefaultHome = lazy(() => import("./pages/Home/index.jsx"));
const Home_BDP = lazy(() => import("./pages/Home_BDP/index.jsx"));

// Dynamic home page loader
const DynamicHome = () => {
    const homePage = import.meta.env.VITE_HOME_PAGE;

    // Try to dynamically import the custom home page
    const HomeComponent = lazy(() =>
        import(`./pages/${homePage}/index.jsx`).catch(() => {
            console.warn(`Home page "${homePage}" not found, using default`);
            return import("./pages/Home/index.jsx");
        })
    );

    return (
        <Suspense fallback={<div>Loading Home Page...</div>}>
            <HomeComponent/>
        </Suspense>
    );
};

function App() {
    return (
        <Router>
            <div style={{display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
                <NavBar/>
                {/* Global Toast Configuration */}
                <ToastContainer
                    position="top-center"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick={false}
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                    transition={Bounce}
                    width={400}
                />
                {/* Main Content (grows dynamically) */}
                <div style={{flex: 1}}>
                    <Suspense fallback={<div>Loading...</div>}>
                        <Routes>
                            <Route path="/test" element={<Test/>}/>

                            <Route path="/" element={<DynamicHome/>}/>

                            {/* Keep default home routes for backup */}
                            <Route path="/home" element={<DefaultHome/>}/>
                            <Route path="/home_bdp" element={<Home_BDP/>}/>

                            <Route path="/about" element={<About/>}/>
                            <Route path="/datasets" element={<DatasetsPage/>}/>

                            <Route path="/samples" element={<Navigate to="/samples/all" replace/>}/>
                            <Route path="/samples/:dataset_id" element={<SamplesPage/>}/>

                            <Route path="/views" element={<ViewsHome/>}/>
                            <Route path="/views/geneview" element={<GeneView/>}/>
                            <Route path="/views/visiumview" element={<VisiumView/>}/>
                            <Route path="/views/xqtlview" element={<XQTLView/>}/>
                            <Route path="/views/genomicregionview" element={<GenomicRegionView/>}/>
                            <Route path="/views/clusters" element={<ClustersView/>}/>
                            <Route path="/views/celltypes" element={<CellTypesView/>}/>
                            <Route path="/views/layersview" element={<LayerView/>}/>
                            <Route path="/views/xcheck" element={<XDatasetsView/>}/>

                            <Route path="/help/howtouse" element={<HowToUse/>}/>
                            <Route path="/help/howtouse/demos" element={<DatasetDemosPage/>}/>
                            <Route path="/help/faq" element={<FAQPage/>}/>
                            <Route path="/help/restapi" element={<RESTAPIPage/>}/>

                            <Route path="/dataset-demos/single-cell" element={<SingleCellDemo/>}/>
                            <Route path="/dataset-demos/visium-st" element={<VisiumSTDemo/>}/>
                            <Route path="/dataset-demos/xqtl" element={<XQTLDemo/>}/>


                            <Route path="/datasetmanager" element={<DatasetManagePage/>}/>

                            <Route path="/login" element={<Login/>}/>

                            {/* Protected Routes */}
                            {/*<Route path="/data" element={<ProtectedRoute roles={['admin', 'user']}><Sample /></ProtectedRoute>}/>*/}
                            {/*<Route path="/analysis" element={<ProtectedRoute roles={['admin']}><Analysis /></ProtectedRoute>}/>*/}

                            {/* Unauthorized page for invalid role access */}
                            <Route path="/unauthorized" element={<UnauthorizedPage/>}/>

                            {/* Page not found */}
                            <Route path="*" element={<NotFoundPage/>}/>

                        </Routes>
                    </Suspense>
                </div>
                <Footer/>
            </div>
        </Router>
    );
}

export default App;