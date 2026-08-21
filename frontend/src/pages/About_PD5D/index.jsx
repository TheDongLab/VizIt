import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-page" style={{paddingBottom: "200px"}}>
      <header className="about-header">
        <h1>{import.meta.env.VITE_APP_TITLE}</h1>
        <p className="subtitle">Advancing Neuroscience Research</p>
      </header>

      <section className="about-content">
        <div className="section">
          <h2>About {import.meta.env.VITE_APP_TITLE}</h2>
          <p>
            The Parkinson’s Cell Atlas web portal is an open, interactive resource developed by the{" "}
            <strong>
              <a href="https://donglab.org/" target="_blank" rel="noopener noreferrer">Dong Lab</a>
              {" "}at the Adams Center for Parkinson’s Disease Research at Yale University
            </strong>
            , as part of{" "}
            <strong>
              <a href="https://www.asapcrn.org/research-community/teams/scherzer/" target="_blank" rel="noopener noreferrer">Team Scherzer</a>
            </strong>
            {" "}within the Aligning Science Across Parkinson’s (ASAP) Collaborative Research Network (CRN).
          </p>
          <p>
            It provides access to a comprehensive, multi-dimensional atlas of the human brain in
            Parkinson’s disease (PD), integrating molecular, cellular, spatial, and clinical data
            across disease progression.
          </p>
          <p>
            This portal is designed to accelerate discovery by enabling researchers to explore,
            visualize, and analyze large-scale multi-omics datasets generated from postmortem human
            brain tissue. By bringing together diverse data modalities into a unified platform, the
            resource supports hypothesis generation, cross-modal integration, and the identification
            of disease-relevant genes, pathways, and cell states.
          </p>
        </div>

        <div className="section">
          <h2>A Team Science Effort</h2>
          <p>
            The underlying PD5D dataset is generated through a collaborative effort led by{" "}
            <a href="https://www.asapcrn.org/research-community/teams/scherzer/" target="_blank" rel="noopener noreferrer">Team Scherzer</a>
            {" "}as part of the Aligning Science Across Parkinson’s (ASAP) Collaborative Research Network (CRN).
          </p>
          <p>
            <a href="https://www.asapcrn.org/research-community/teams/scherzer/" target="_blank" rel="noopener noreferrer">Team Scherzer</a>
            {" "}is a multidisciplinary consortium of investigators across institutions, combining
            expertise in genomics, neuroscience, computational biology, neuropathology, and clinical
            research. Rather than representing the work of a single laboratory, this atlas reflects a{" "}
            <strong>team science approach</strong>, integrating contributions from multiple groups
            within the ASAP CRN and beyond.
          </p>
          <p>
            This collaborative framework enables the scale, depth, and rigor required to map
            Parkinson’s disease biology across:
            <ul>
              <li>Brain regions (spatial dimension)</li>
              <li>Cell types (cellular diversity)</li>
              <li>Disease stages (temporal progression)</li>
              <li>Molecular layers (multi-omics integration)</li>
            </ul>
            PD5D captures the molecular architecture of PD across five key dimensions—brain space,
            disease stage, and cell types, together with multi-omic regulatory layers. The datasets
            integrated into this portal include:
            <ul>
              <li>Single-nucleus RNA sequencing (snRNA-seq)</li>
              <li>Spatial transcriptomics</li>
              <li>Single-nucleus epigenomics (e.g., ATAC-seq)</li>
              <li>Genomic variation, including eQTL and caQTL analyses</li>
              <li>Clinical and neuropathological annotations</li>
            </ul>
            Together, these data enable a systems-level understanding of PD, from early vulnerability
            to advanced disease.
          </p>
        </div>

        <div className="section">
          <h2>Purpose of the Portal</h2>
          This portal was developed to make PD5D data{" "}
          <strong>accessible, explorable, and reusable</strong> for the broader scientific community.
          Key goals include:
          <ul>
            <li>Democratizing access to large-scale PD brain datasets</li>
            <li>Enabling intuitive visualization of multi-omics data</li>
            <li>Supporting integrative and cross-modal analyses</li>
            <li>Accelerating identification of therapeutic targets and biomarkers</li>
          </ul>
          The platform is intended for neuroscientists, computational biologists, clinicians, and
          method developers studying Parkinson’s disease and related neurodegenerative disorders.
        </div>

        <div className="section">
          <h2>Commitment to Open Science</h2>
          <p>
            In alignment with ASAP’s open science principles, all data and tools in this portal are
            shared to promote transparency, reproducibility, and collaboration. The portal is built
            on an open-source framework called{" "}
            <a href="https://github.com/TheDongLab/VizIt" target="_blank" rel="noopener noreferrer">VizIt</a>
            {" "}developed by Dr. Ruifeng Hu and Christopher Zhang in Dong Lab at Yale:
            <ul>
              <li>
                Code repository:
                <a href="https://github.com/TheDongLab/VizIt" target="_blank" rel="noopener noreferrer"> https://github.com/TheDongLab/VizIt</a>
              </li>
              <li>
                Documentation:{" "}
                <a href="https://thedonglab.github.io/VizIt/" target="_blank" rel="noopener noreferrer">https://thedonglab.github.io/VizIt/</a>
              </li>
            </ul>
            We encourage the community to explore, reuse, and extend these resources to advance our
            collective understanding of Parkinson’s disease.
          </p>
        </div>

        <div className="section">
          <h2>Contributors to the portal development</h2>
          <ul>
            <li><strong>Xianjun Dong (Principal Investigator, Yale)</strong> - Oversee all aspects of development and research.</li>
            <li><strong>Ruifeng Hu (Lead Developer, Yale)</strong> - Lead the project, design and implement the portal's features, ensuring that the portal is both powerful and user-friendly.</li>
            <li><strong>Christopher Zhang (Developer, Concord Academy)</strong> - xQTL datasets processing, xQTL visualization, and genomic view page development.</li>
            <li><strong>Yanqing Lou (Developer, Northeastern University)</strong> - Frontend development and UI enhancements.</li>
            <li><strong>Zechuan Lin (Data contributor, Yale)</strong> - MTG eQTL, PD GWAS dataset.</li>
            <li><strong>Mingming Lu (Data contributor, Yale)</strong> - Midbrain eQTL/scQTL, scATACseq dataset.</li>
            <li><strong>Jacob Parker (Data contributor, Yale)</strong> - MTG snRNAseq dataset.</li>
            <li><strong>Weiqiang Liu (Data contributor, Yale)</strong> - Multi-omics bigwig dataset.</li>
            <li><strong>Jie Yuan (Data contributor, Yale)</strong> - Visium ST dataset.</li>
          </ul>
        </div>

        <div className="section">
          <h2>How to Cite</h2>
          <p>
            If you use data or analyses from the Parkinson’s Cell Atlas, please cite the following:
          </p>
          <p>
            <strong>Primary Dataset / Resource Paper</strong>
            <br />(to be updated upon publication)
            <br />The Parkinson’s Cell Atlas (PD5D Consortium / Team Scherzer).
            <br />[Journal Name], [Year].
            <br />DOI: [To be added]
          </p>
          <p>
            <strong>Portal / Web Resource</strong>
            <br />Parkinson’s Cell Atlas.
            <br />Yale School of Medicine, Team Scherzer.
            <br />
            <a href="https://pd5d.yale.edu" target="_blank" rel="noopener noreferrer">https://pd5d.yale.edu</a>
            <br /> Accessed: [Month Day, Year]
          </p>
        </div>

        <div className="section">
          <h2>Acknowledgments</h2>
          <p>
            We thank all members of{" "}
            <a href="https://www.asapcrn.org/research-community/teams/scherzer/" target="_blank" rel="noopener noreferrer">Team Scherzer</a>
            , our collaborators across the ASAP Collaborative Research Network, and the patients and
            families who made this research possible.
          </p>
          <p>
            We kindly ask that publications using this resource include the following acknowledgment:
            <br />“Data were obtained from the Parkinson’s Cell Atlas portal developed by Team
            Scherzer as part of the Aligning Science Across Parkinson’s (ASAP) Collaborative Research
            Network.”
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
