'use strict';

var welcomeForm = document.querySelector('#welcomeForm');

welcomeForm.addEventListener('submit', connect, true)

var stompClient = null;
var name = null;

function connect(event) {
	name = document.querySelector('#name').value.trim();

	if (name) {
		document.querySelector('#welcome-page').classList.add('hidden');
		document.querySelector('#dialogue-page').classList.remove('hidden');

		var socket = new SockJS('/chatApp-Pub');
		stompClient = Stomp.over(socket);

		stompClient.connect({}, connectionSuccess);
	}
	event.preventDefault();
}

function connectionSuccess() {

	stompClient.send("/app/chat.newUser", {}, JSON.stringify({
		sender : name,
		type : 'newUser'
	}))
}

function onCvLoaded () {	    
    cv.onRuntimeInitialized = onReady;
}

function dataUriToBlob(dataUri){
	const b64=atob(dataUri.split(',')[1]);
	const u8=Uint8Array.from(b64.split(''),e=> e.charCodeAt());
	return new Blob([u8] , {type:'image/png'});
}

const canvasOutput = document.getElementById('canvasOutput');

const video = document.getElementById('video');
const actionBtn = document.getElementById('actionBtn');
const width = 320;
const height = 240;
const FPS = 30;
let stream;
let streaming = false;

function onReady () {
	let src;
	let dst;
	const cap = new cv.VideoCapture(video);

	actionBtn.addEventListener('click', () => {
		if (streaming) {
			stop();
			actionBtn.textContent = 'Start';
		} else {
			start();
			actionBtn.textContent = 'Stop';
		}
	});

	function start () {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true })
		.then(_stream => {
			stream = _stream;	    		
			video.srcObject = stream;
			video.play();
			streaming = true;
			src = new cv.Mat(height, width, cv.CV_8UC4);
			dst = new cv.Mat(height, width, cv.CV_8UC1);
			setTimeout(processVideo, 0)
		}).catch(err => console.log(`An error occurred: ${err}`));
	}

	function stop () {
		if (video) {
			video.pause();
			video.srcObject = null;
		}
		if (stream) {
			stream.getVideoTracks()[0].stop();
		}
		streaming = false;
	}

	function processVideo () {	 
		if (!streaming) {
			//alert("streaming stopped");
			src.delete();
			dst.delete();
			return;
		}
		const begin = Date.now();
		cap.read(src);
		cv.cvtColor(src, dst, cv.COLOR_BGR2BGRA);
		let img = dst;		
		cv.imshow('canvasOutput', dst);
		const dataImg = canvasOutput.toDataURL();		
		//console.log('DATA::'+ dataImg);
		
		if (stompClient) {		
			var chatMessage = {
					sender : name,
					content : dataImg,
					type : 'CHAT'
			};
			stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));    
		}		
		const delay = 1000/FPS - (Date.now() - begin);
		setTimeout(processVideo, delay);		
	}
}