// Load application styles
import 'styles/index.scss';

// ================================
// START YOUR APP HERE
// ================================

// You can use jquery for ajax request purpose only.
import $ from 'jquery';

let eventsData = [];
const latLng = {};
let map;
const key = 'AIzaSyBH2-HGPGrJadRBzQ3roCVFHYT1ODufKI8';

window.onload = initMap;

document.querySelector('.section-map__input').addEventListener('keydown', controlMeetUpData);

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: { lat: 40.730610, lng: -73.935242 },
		zoom: 11,
	});

	const input = document.querySelector('.section-map__input');
	const searchBox = new google.maps.places.SearchBox(input);

	searchBox.addListener('places_changed', () => {
		latLng.lat = searchBox.getPlaces()[0].geometry.location.lat();
		latLng.lng = searchBox.getPlaces()[0].geometry.location.lng();

		controlMeetUpData(latLng);
	});

	google.maps.event.addListener(map, 'click', (event) => {
		const clickLat = event.latLng.lat();
		const clickLon = event.latLng.lng();

		console.log(clickLat);
		console.log(clickLon);
	});
}

function controlMeetUpData(location) {

	const meetUpPromise = requestMeetUpLists();

	meetUpPromise
		.then(saveUpcomingEvents)
		.then(changeMapView)
		.then(displayEvents)
		.then(displayLists)
}

function getSearchWord(ev) {
	const searchWord = ev.target.value;

	return searchWord;
}

function getLocation(city) {
	return new Promise((resolve, reject) => {
		const geoCoder = new google.maps.Geocoder();

		new Promise((resolve, reject) => {
			geoCoder.geocode( { 'address' : city }, handleLocation);

			function handleLocation (result, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					latLng.lat = parseFloat(result[0].geometry.location.lat());
					latLng.lng = parseFloat(result[0].geometry.location.lng());
					resolve(latLng);
				} else {
					alert(status);
				}
			}
		}).then(() => {
			resolve(latLng);
		});
	});
}

function requestMeetUpLists() {
	return new Promise((resolve, reject) => {
		const url = `https://api.meetup.com/find/upcoming_events?&sign=true&lat=${latLng.lat}&lon=${latLng.lng}2&key=d1f4549d314392d4b48651c3e4a&fields=event_hosts&page=20`;

		$.ajax({
			dataType: 'jsonp',
			url,
			type: 'GET',
			success: function handleData(data) {
				resolve(data);
			},
			error: function handleError(error) {
				reject(error);
			},
		});
	});
}

function saveUpcomingEvents(response) {
	eventsData = response.data.events;
}

function changeMapView() {
	map.setCenter(latLng);
}

function displayEvents() {
	for (let i = 0; i < eventsData.length; i++) {
		const lat = eventsData[i].venue ? eventsData[i].venue.lat : eventsData[i].group.lat;
		const lng = eventsData[i].venue ? eventsData[i].venue.lon : eventsData[i].group.lon;
		const marker = new google.maps.Marker({
			position: {
				lat,
				lng,
			},
			map,
		});
	}
}

function displayLists() {
	let lists = '';

	for (let i = 0; i < 10; i++) {
		const hostName = eventsData[i].event_hosts ? eventsData[i].event_hosts[0].name : 'Anonymous';
		const hostImg = eventsData[i].event_hosts ? eventsData[i].event_hosts[0].photo.thumb_link : '';
		const listMarkup = `
			<li class="section-list__event-info">
				<div class="section-list__event-name">Event Name : ${eventsData[i].name}</div>
				<div class="section-list__group-name">Group Name : ${eventsData[i].group.name}</div>
				<div class="section-list__date">Local Date : ${eventsData[i].local_date}</div>
				<div class="section-list__time">Local Time : ${eventsData[i].local_time}</div>
				<div class="section-list__rsvp">Yes RSVP : ${eventsData[i].yes_rsvp_count}</div>
				<div class="section-list__host-name">${hostName}</div>
				<img class="section-list__host-img" src="${hostImg}">
			</li>
		`;

		lists += listMarkup;
	}

	document.querySelector('.section-list__container').innerHTML = '';
	document.querySelector('.section-list__container').innerHTML = lists;
}

function handleError(err) {
	console.log('error');
	console.log(err);
}
