export default function Loading() {
  return (
    <div className="loading-screen">
      <div className="loader">
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-core"></div>
      </div>
      <p className="loading-text">Loading</p>
    </div>
  );
}
