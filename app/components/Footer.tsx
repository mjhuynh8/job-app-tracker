import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import "./footer.css";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Job Application Tracker</h3>
            <p>
              Streamline your job search and stay organized with our application
              tracking system.
            </p>
            <p>Built by Jorge, Marcus, Caitlin, and Ava (CS-5784 Team 6).</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/job-dashboard">Job Dashboard</a>
              </li>
              <li>
                <a href="/job-form">Add New Job</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <FaLinkedin />
              </a>
              <a href="mailto:contact@example.com" aria-label="Email">
                <FaEnvelope />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Job Application Tracker.</p>
        </div>
      </div>
    </footer>
  );
}
