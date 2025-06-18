import React from "react";
import pic2 from "../img/videolog2.jpg";
import 'bootstrap/dist/css/bootstrap.min.css';     // ✅ Correct way
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '../App.css'
import backgroundVideo from '../video/backgound.mp4';

function Main2() {
  return (
  <>
   <div style={{ position: 'relative', height: '100vh', overflow:'hidden' }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1,
          }}
        >
          <source src={backgroundVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>



    <div Class="conatiner w-50 h-75  mb-5 mt-5 br-2px solid red">
     <div className="card " style={{width: "30rem",backgroundColor: 'rgba(255, 255, 255, 0.8)',   backdropFilter: 'blur(5px)',  borderRadius: '10px',}} bg>
  <img src={pic2} className="card-img-top" style={{opacity: 0.3, 
        borderTopLeftRadius: '10px',
        borderTopRightRadius: '10px',
      }}
 alt="..."/>
  <div className="card-body">
    <h5 className="card-title">Card title</h5>
    <p className="card-text">Some quick text content inside the card.</p>
    <a href="#" className="btn btn-primary">Lang-talk</a>
  </div>
</div>
</div>
      </div>
    </>
  );
}

export default Main2;
