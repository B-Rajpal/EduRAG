import loading_gif from "../assests/loading.gif";

const Loader = () => (
  <div
    style={{
      position: "absolute", // To ensure the loader is on top
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent dark background
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1, // Loader on top
      borderRadius: "10px", // Optional: rounded corners
    }}
  >
    <div style={{ textAlign: "center" }}>
      <img src={loading_gif} alt="Loading..." />
    </div>
  </div>
);

export default Loader;
