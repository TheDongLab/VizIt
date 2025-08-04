import { Link } from "react-router-dom"
import "./DatasetDemos.css"

const DatasetDemosPage = () => {
  return (
    <div className="docs-container">
      <header className="docs-header">
        <div className="container">
          <h1>{import.meta.env.VITE_APP_TITLE} Dataset Preparation Guides</h1>
          <p className="subtitle">Comprehensive guides for omics data preparation with demos</p>
        </div>
      </header>

      <main className="container">
        <section className="intro-section">
          <h2>Welcome to {import.meta.env.VITE_APP_TITLE}</h2>
          <p>
            {import.meta.env.VITE_APP_TITLE} is a comprehensive platform for single-cell, spatial transcriptomics, and other omics data
            analysis and visualization. This documentation will guide you through the data preparation processes for
            different data types.
          </p>
        </section>

        <div className="docs-grid">
          <section className="docs-card">
            <div className="card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
                <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
                <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
                <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
                <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
              </svg>
            </div>
            <h3>Single-Cell Data Preparation</h3>
            <p>
              Learn how to prepare and process single-cell/nuclei RNA sequencing data for visualization in {import.meta.env.VITE_APP_TITLE}. This
              section covers seurat object processing, gene expression data splitting, metadata table preparation and data formatting.
            </p>
            <Link to="/dataset-demos/single-cell" className="docs-link">
              View Documentation
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </section>

          <section className="docs-card">
            <div className="card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <rect x="7" y="7" width="3" height="3"></rect>
                <rect x="14" y="7" width="3" height="3"></rect>
                <rect x="7" y="14" width="3" height="3"></rect>
                <rect x="14" y="14" width="3" height="3"></rect>
              </svg>
            </div>
            <h3>Visium ST Data Preparation</h3>
            <p>
              Explore the workflow for preparing spatial transcriptomics data from 10x Genomics Visium platform. This
              guide covers data extraction, metadata preparation, and data integration.
            </p>
            <Link to="/dataset-demos/visium-st" className="docs-link">
              View Documentation
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </section>

          <section className="docs-card">
            <div className="card-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 2l20 20"></path>
                <path d="M14.5 9.5L9.5 14.5"></path>
                <path d="M8.5 8.5l7 7"></path>
                <path d="M6.5 6.5l11 11"></path>
                <path d="M2 12h4"></path>
                <path d="M12 2v4"></path>
                <path d="M22 12h-4"></path>
                <path d="M12 22v-4"></path>
              </svg>
            </div>
            <h3>xQTL Data Preparation</h3>
            <p>
              Understand how to prepare expression quantitative trait loci (xQTL) data for visualization in {import.meta.env.VITE_APP_TITLE}. This section covers
              raw data conversion, Gene-SNP pair fitering, and data formatting.
            </p>
            <Link to="/dataset-demos/xqtl" className="docs-link">
              View Documentation
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </section>
        </div>

        <section className="additional-resources" style={{ marginBottom: "150px" }}>
          <h2>Additional Resources</h2>
          <div className="resources-grid">
            {/*<div className="resource-item">*/}
            {/*  <h4>API Reference (Coming soon)</h4>*/}
            {/*  <p>Complete API documentation for programmatic access to BrainDataPortal</p>*/}
            {/*  <a href="/docs/api" className="resource-link">*/}
            {/*    View API Docs*/}
            {/*  </a>*/}
            {/*</div>*/}
            <div className="resource-item">
              <h4>Github scource code</h4>
              <p>Explore the source code for BrainDataPortal</p>
              <a href="https://github.com/huruifeng/BrainDataPortal" className="resource-link">
                View Github
              </a>
            </div>
            <div className="resource-item">
              <h4>Tutorials</h4>
              <p>Step-by-step tutorials for common analysis workflows</p>
              <a href="/help/howtouse" className="resource-link">
                Browse Tutorials
              </a>
            </div>
            <div className="resource-item">
              <h4>FAQ</h4>
              <p>Frequently asked questions about data preparation and analysis</p>
              <a href="/help/faq" className="resource-link">
                Read FAQ
              </a>
            </div>
          </div>
        </section>
      </main>

      {/*<footer className="docs-footer">*/}
      {/*  <div className="container">*/}
      {/*    <p>&copy; {new Date().getFullYear()} BrainDataPortal. All rights reserved.</p>*/}
      {/*  </div>*/}
      {/*</footer>*/}
    </div>
  )
}

export default DatasetDemosPage
