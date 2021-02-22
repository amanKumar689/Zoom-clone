const video_room = document.getElementsByClassName('video_room')[0]
var myvideo
const socket = io();
var peer = new Peer(undefined, {
    path: '/myapp',
    host: 'localhost',
    port: '9000'
})
peer.on('open', (id) => { 
    // i told server that i am connected 
    socket.emit('room_join_rqst', roomId, id)
})
 

//                                           getting video stream

var myStream
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    addVideo(stream);
    myvideo = document.getElementsByTagName('video')[0];
    myStream = stream;
    function emit() {
        socket.emit('ending', myvideo.srcObject.id)
    }

    window.onbeforeunload = () => {
        emit();  // when close tab then other should know that i am disconnected(in my case call.on('close') doesn't work i do not know why ?) 
    }

    var meta_data
    socket.on('some', (id) => { // listen for server response when somebody connected

        // i have got the id from server let call that person by peer //// 
        // here i am using setTimeout cause btw socket connection and peer connection it should be delayed then it work (in my case)
        setTimeout(() => {
             const call = peer.call(id, stream);
            call.on('stream', (stream) => { 
                //  it will execute for each track of stream ie. audio as well as video
                if (stream.id != meta_data) {  // stream must be listen only once for each peer (audio:true,video:true conflict solve)
                    addVideo(stream);
                }
                meta_data = stream.id
            })
        }, 1000);

    })



    //                                 let listen if anybody call me 
   
      peer.on('call', (call) => {

        call.answer(stream)   // give answer to caller
        call.on('stream', (stream) => {  // caller call me with stream so let use his/her stream to my video element

            if (stream.id != meta_data) { // here also from line 39 use her/his stream only once casue stream event run two times for each track of anser stream
                addVideo(stream);
            }
            meta_data = stream.id

        })
    })
}) // here ending of stream collection using webRTC, call listen , call answer


//  AUDIO MUTE MECHANISM

var audioStatus = true
document.getElementsByClassName('mute')[0].addEventListener('click', (e) => {

        if (audioStatus == true) {
            myStream.getAudioTracks()[0].enabled = false  // stop audiotrack from stream so other end who is getting my stream also not get audio(video.muted only work for itself)
            audioStatus = false;
            e.target.classList.toggle('fa-microphone-slash')
        } else {
            myStream.getAudioTracks()[0].enabled = true
            e.target.classList.toggle('fa-microphone-slash')
            audioStatus = true;

        }
    })


    //  VIDEO MUTE MECHANISM

var videoStatus = true
document.getElementsByClassName('pause')[0].addEventListener('click', (e) => {

    if (videoStatus == true) {
        stopStreamedVideo(myStream) //   stop video from stream just like audio above line 73
        videoStatus = false;
        e.target.classList.toggle('fa-video-slash')
    } else {
        startStreamedVideo(myStream)
        e.target.classList.toggle('fa-video-slash')
        videoStatus = true;
    }

})

// function for add each stream(me or other getting using peer)  to video element so i can display on html webpage
function addVideo(stream) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    video_room.append(video);
}


// let send(emit) data from input to other socket connected client with the help of
// socket server(i emit message then socket server listen my message and  emit this message to other socket except me)

document.getElementById('send').addEventListener('click', () => {
    socket.emit('message', data.value);
})

// listen for message that socket server emit 
socket.on('message', (data) => {

    // append the message to chat section of my html
    const chat_msg = document.getElementsByClassName('chat_msg')[0];
    const p = document.createElement('p');
    const text = document.createTextNode(`${data}`);
    p.append(text)
    chat_msg.append(p);
})


// start or stop video track

function stopStreamedVideo(myStream) {
    const stream = myStream;
    stream.getVideoTracks()[0].enabled = false;
}
function startStreamedVideo(myStream) {
    const stream = myStream;
    stream.getVideoTracks()[0].enabled = true;
}


// it will be listen when someone closed from connection

socket.on('ending', (id) => { // i got stream id of that person who diconnected 
    const video = document.getElementsByTagName('video');
    Array.from(video).forEach(element => {
        if (element.srcObject.id == id) {    // let remove that stream from my tab
            element.remove();
        }
    });
})