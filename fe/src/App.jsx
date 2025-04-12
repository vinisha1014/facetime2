

import { useState, useEffect, useRef } from 'react'
import './App.css'
import io from 'socket.io-client'

const socket = io("http://localhost:3000");
const peer = new RTCPeerConnection();

function App() {
    const selfVideoRef = useRef(null);
    const otherVideoRef = useRef(null);
    const [showOtherVideo,setShowOtherVideo] = useState(false);

    useEffect(() => {

        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then((stream) => {
                console.log("stream", stream);
                selfVideoRef.current.srcObject = stream;
                stream.getTracks().forEach((track) => {
                    console.log("track", track);
                    peer.addTrack(track, stream);
                });
            })
            .catch((err) => {
                console.log(err);
            });

        peer.ontrack = (event) => {
            otherVideoRef.current.srcObject = event.streams[0];
            setShowOtherVideo(true);
        }



        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", event.candidate);
            }
        }


        socket.on("offer", async (offer) => {
            await peer.setRemoteDescription(offer);

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit("answer", answer);
        });

        socket.on("answer", async (answer) => {
            await peer.setRemoteDescription(answer);
        });



        socket.on("ice-candidate", async (candidate) => {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
        });




    }, []);

    const handleCall = async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("offer", offer);
    }


    return (
        <div className="main-container">
            <div className="video-container">
                <div className="self-video">
                    <video ref={selfVideoRef} autoPlay playsInline></video>
                </div>
                <div className="other-video">
                    <video ref={otherVideoRef} autoPlay playsInline></video>
                </div>
            </div>
            <button onClick={handleCall} className="call-button">Call</button>
        </div>

    )
}

export default App