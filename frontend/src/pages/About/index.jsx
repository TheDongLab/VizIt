import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-page">
      <header className="about-header">
        <h1>About {import.meta.env.VITE_APP_TITLE}</h1>
        <p className="subtitle">Advancing Neuroscience Research</p>
      </header>

      <section className="about-content">
        <div className="section">
          <h2>Our Mission</h2>
          <p>
            The Brain Data Portal serves as a comprehensive resource for
            neuroscientists and researchers, offering cutting-edge tools and
            data to advance our understanding of the brain. This initiative
            reflects our commitment to fostering innovation, collaboration, and
            discovery in neuroscience research.
          </p>
        </div>

        <div className="section">
          <h2>Origins and Leadership</h2>
          <p>
            The Brain Data Portal is a project developed by the
            <strong> Yale School of Medicine</strong>, under the leadership of
            the <strong>Xianjun Dong Lab</strong>. Our team specializes in
            computational biology and neuroscience, focusing on creating
            resources that enable transformative research in brain health and
            disease.
          </p>
        </div>

        <div className="section">
          <h2>Key Features</h2>
          <ul>
            <li>Comprehensive datasets spanning multiple brain research areas.</li>
            <li>Interactive visualization tools for deeper data exploration.</li>
            <li>Advanced filtering and querying capabilities for targeted insights.</li>
            <li>A user-friendly interface to make complex datasets accessible to all.</li>
          </ul>
        </div>

        <div className="section">
          <h2>Collaboration Opportunities</h2>
          <p>
            We welcome partnerships with researchers, institutions, and
            organizations to expand the scope and impact of the Brain Data
            Portal. If you're interested in collaborating, please feel free to
            <a href="mailto:contact@braindataportal.yale.edu"> contact us</a>.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
