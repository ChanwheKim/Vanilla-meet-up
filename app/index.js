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
const googleKey = 'AIzaSyBH2-HGPGrJadRBzQ3roCVFHYT1ODufKI8';
const bookmarkData = {};

window.onload = initMap;

document.querySelector('.section-list__container').addEventListener('click', controlLikes);

document.querySelector('.section-map__bookmark').addEventListener('click', deleteBookmark);

document.querySelector('.btn-bookmark').addEventListener('click', showBookmarkBar);

function showBookmarkBar(ev) {
	const btn = ev.target.closest('.btn-bookmark');

	if (btn) {
		document.querySelector('.section-map__bookmark').classList.toggle('inactive');
	}
}

function deleteBookmark(ev) {
	const deleteIcon = ev.target.closest('.btn-bookmark-delete');

	if (deleteIcon) {
		const key = deleteIcon.parentElement.id;

		delete bookmarkData[key];
	}

	localStorage.setItem('bookmark', JSON.stringify(bookmarkData));

	deleteIcon.parentElement.remove();

	document.querySelector('.bookmark-count').textContent = Object.values(bookmarkData).length;

	const isEmpty = Object.values(bookmarkData).length === 0;

	if (isEmpty) {
		document.querySelector('.bookmark-count').classList.add('inactive');
		document.querySelector('.section-map__bookmark').classList.add('inactive');
	}
}

function controlLikes(ev) {
	const bookmark = ev.target.closest('.event-clip');
	const bookmarkIcon = bookmark.children[0];

	if (bookmark) {
		const id = bookmark.parentElement.parentElement.id;
		const key = ev.target.closest('.section-list__event-info').dataset.key;
		const lat = eventsData[id].venue ? eventsData[id].venue.lat : eventsData[id].group.lat;
		const lng = eventsData[id].venue ? eventsData[id].venue.lon : eventsData[id].group.lon;
		const bookmarkList = {
			key,
			eventName: eventsData[id].name,
			date: eventsData[id].local_date,
			img: eventsData[id].group.key_photo.highres_link,
			latLng: { lat, lng },
		};

		if (!bookmarkData[key]) {
			bookmarkData[key] = bookmarkList;

			localStorage.setItem('bookmark', JSON.stringify(bookmarkData));

			bookmarkIcon.classList.add('selected');
			const htmlBookmarkStr = makeBookmarkEl(bookmarkList);

			document.querySelector('.section-map__bookmark').insertAdjacentHTML('beforeend', htmlBookmarkStr);

			document.querySelector('.bookmark-count').textContent = Object.values(bookmarkData).length;
			document.querySelector('.bookmark-count').classList.remove('inactive');
		}
	}
}

function makeBookmarkEl(bookmark) {
	return `
		<li class="section-map__book-clip" id="${bookmark.key}">
			<img class="section-map__book-clip-img" src="${bookmark.img}">
			<div class="book-clip-info">
					<div class="section-map__event-name">${bookmark.eventName}</div>
					<div class="section-map__book-clip-date">${bookmark.date}</div>
					<div class="btn-move" data-lat="${bookmark.latLng.lat}" data-lng="${bookmark.latLng.lng}">move to this place<span>&rarr;</span></div>
			</div>
			<div class="icon btn-bookmark-delete">
				<svg class="icon-bin">
					<use xlink:href="/assets/images/sprite.svg#icon-bin"></use>
				</svg>
			</div>
		</li>
	`;
}

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: { lat: 37.773972, lng: -122.431297 },
		zoom: 13,
	});

	const input = document.querySelector('.map__input');
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
		.catch(handleError)
}

function requestMeetUpLists() {
	return new Promise((resolve, reject) => {
		const url = `https://api.meetup.com/find/upcoming_events?&sign=true&lat=${latLng.lat}&lon=${latLng.lng}2&key=d1f4549d314392d4b48651c3e4a&fields=event_hosts,comment_count,group_key_photo&page=20`;

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
	console.log(response.data);
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
		const commentCount = eventsData[i].comment_count ? eventsData[i].comment_count : 0;
		const hostName = eventsData[i].event_hosts ? eventsData[i].event_hosts[0].name : 'Anonymous';
		const hostImg = eventsData[i].event_hosts ? eventsData[i].event_hosts[0].photo.thumb_link : '/assets/images/default-user-image.png';
		let createdTime = eventsData[i].created ? eventsData[i].created : eventsData[i].group.created;

		createdTime = convertCreatedTime(createdTime);

		const listMarkup = `
		<li class="section-list__event-info" id="${i}" data-key="${eventsData[i].id}">
			<div class="section-list__host-info">
				<img class="section-list__host-img" src="${hostImg}">
				<div class="section-list__host-name">${hostName}</div>
				<div class="section-list__created">${createdTime}</div>
			</div>
			<div class="section-list__event-details">
				<div class="section-list__event-name">${eventsData[i].name}</div>
				<div class="section-list__group-name">${eventsData[i].group.name}</div>
				<div class="section-list__date">Date : ${eventsData[i].local_date}</div>
				<div class="section-list__time">Time : ${eventsData[i].local_time}</div>
				<div class="section-list__rsvp">RSVP : ${eventsData[i].yes_rsvp_count} guests</div>
				<div class="icon event-clip">
						<svg class="icon-heart">
								<use xlink:href="/assets/images/sprite.svg#icon-heart"></use>
						</svg>
				</div>
				<div class="icon comment-wrapper">
					<svg class="icon-comment">
						<use xlink:href="/assets/images/sprite.svg#icon-comment"></use>
					</svg>
					<span>${commentCount}</span>
				</div>
			</div>
		</li>
		`;

		lists += listMarkup;
	}

	document.querySelector('.section-list__container').innerHTML = '';
	document.querySelector('.section-list__container').innerHTML = lists;
}

function convertCreatedTime(milliSec) {
	const created = (milliSec) / (1000 * 60 * 60);
	const now = new Date() / (1000 * 60 * 60);
	let timeDiff = parseInt(now - created);
	let timeLable;

	if (timeDiff >= 24) {
		timeDiff = parseInt(timeDiff % 24);
		timeLable = timeDiff === 1 ? `${timeDiff} day ago` : `${timeDiff} days ago`;
	} else {
		timeLable === 1 ? `${timeDiff} hour ago`: `${timeDiff} hours ago`;
	}

	return timeLable;
}

function handleError(err) {
	alert('Something went wrong. Could you try it again?');
	console.log(err);
}
