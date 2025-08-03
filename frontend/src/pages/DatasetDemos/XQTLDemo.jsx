import { Link } from "react-router-dom"

const XQTLDemo = () => {
  return (
    <div className="docs-container">
      <header className="docs-header">
        <div className="container">
          <Link to="/help/howtouse/demos" className="back-link">
            ← Back to Documentation
          </Link>
          <h1>xQTL Data Preparation</h1>
        </div>
      </header>

      <main className="container">
        <div className="docs-content">
          <p className="lead">
            This page will contain detailed documentation about expression quantitative trait loci (xQTL) data
            preparation.
          </p>
          <p>Coming soon...</p>
        </div>
      </main>
    </div>
  )
}

export default XQTLDemo
