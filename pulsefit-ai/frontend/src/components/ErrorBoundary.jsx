import React from "react";
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }
  static getDerivedStateFromError(error) {
    return {
      error
    };
  }
  componentDidCatch(error, info) {
    console.error("PulseFit page crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return <div style={{
        padding: 30
      }}>
          <h2>Something went wrong</h2>
          <pre style={{
          color: "red",
          whiteSpace: "pre-wrap"
        }}>
            {this.state.error.message}
          </pre>
          <button onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>;
    }
    return this.props.children;
  }
}
