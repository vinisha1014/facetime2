import { useEffect, useRef, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import CallScreen from "./CallScreen";
import useSound from "use-sound";
import RingingSound from "./assests/ringing.mp3"


const socket = io("http://localhost:3000");
const peer = new RTCPeerConnection({
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
});

function App() {


    const [play, { stop }] = useSound(RingingSound);

    const tempOtherVideoRef = useRef(null);
    const selfVideoRef = useRef(null);
    const otherVideoRef = useRef(null);
    const [showOtherVideo, setShowOtherVideo] = useState(false);

    const [isCallRinging, setIsCallRinging] = useState(false);

    const handleAccept = async () => {
        try {
            if (peer.signalingState === "have-remote-offer") {

                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit("answer", answer);
                
            
                if (tempOtherVideoRef.current) {
                    setShowOtherVideo(true);
                }
            } else {
                console.error("Cannot create answer: peer connection is in", peer.signalingState, "state");
            }
        } catch (error) {
            console.error("Error accepting call:", error);
        }
        setIsCallRinging(false);
        stop();
    }

    const handleReject = () => {
        setIsCallRinging(false);
        stop();
    }

    useEffect(() => {
        if (isCallRinging) {
            play();
        } else {
            stop();
        }
    }, [isCallRinging, play, stop]);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            .then((stream) => {
                selfVideoRef.current.srcObject = stream;
                stream.getTracks().forEach((track) => {
                    peer.addTrack(track, stream);
                });
            })
            .catch((err) => {
                console.error("Error accessing media devices:", err);
            });

        peer.ontrack = (event) => {
            tempOtherVideoRef.current = event.streams[0];
            setShowOtherVideo(true);
            
            
            if (otherVideoRef.current) {
                otherVideoRef.current.srcObject = event.streams[0];
            }
        }

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", event.candidate);
            }
        }

        socket.on("offer", async (offer) => {
            try {
                await peer.setRemoteDescription(new RTCSessionDescription(offer));
                setIsCallRinging(true);
            } catch (error) {
                console.error("Error setting remote description from offer:", error);
            }
        });

        socket.on("answer", async (answer) => {
            try {
                await peer.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (error) {
                console.error("Error setting remote description from answer:", error);
            }
        });

        socket.on("ice-candidate", async (candidate) => {
            try {
                if (candidate) {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (error) {
                console.error("Error adding ICE candidate:", error);
            }
        });

        // Clean up function to stop sound and remove event listeners
        return () => {
            stop();
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
        };

    }, [play, stop]);

    useEffect(() => {
        if (showOtherVideo && otherVideoRef.current && tempOtherVideoRef.current) {
            otherVideoRef.current.srcObject = tempOtherVideoRef.current;
        }
    }, [showOtherVideo]);

    const handleCall = async () => {
        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            socket.emit("offer", offer);
        } catch (error) {
            console.error("Error creating offer:", error);
        }
    }

    return (
        <div className="main-container">
            {
                isCallRinging && <CallScreen onAccept={handleAccept} onReject={handleReject} />
            }

            <div className="video-container">
                <div className="self-video">
                    <video ref={selfVideoRef} autoPlay playsInline></video>
                </div>
                {showOtherVideo &&
                    <div className="other-video">
                        <video ref={otherVideoRef} autoPlay playsInline></video>
                    </div>
                }
            </div>

            <button onClick={handleCall} className="call-btn">Call</button>
        </div>
    )
}

export default App