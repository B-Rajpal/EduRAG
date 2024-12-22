import loading_gif from "../assests/loading.gif"

const Loader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '10vh',zIndex: "1" }}>
        <img src={loading_gif} alt="Loading..." />
    </div>
);

export default Loader;
