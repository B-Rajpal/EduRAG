import loading_gif from "../assests/loading.gif"

const Loader = () => (
    <div className="flex-center height-10vh z-index-1">
        <img src={loading_gif} alt="Loading..." />
    </div>
);


export default Loader;
