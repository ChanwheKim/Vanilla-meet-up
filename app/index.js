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
let bookmarkData = {};

window.onload = function init() {
	bookmarkData = JSON.parse(localStorage.getItem('bookmark'));

	Object.values(bookmarkData).forEach((bookmark) => {
		displayBookmarkList(bookmark);
	});

	initMap();
};

document.querySelector('.section-list__container').addEventListener('click', (ev) => {
	if (ev.target.closest('.event-clip')) {
		controlLikes(ev);
	} else if (ev.target.closest('.section-list__event-details')) {
		controlGroupInfo(ev);
	}
});

document.querySelector('.btn-cross').addEventListener('click', hideSidebar);

function hideSidebar(ev) {
	const btnClose = ev.target.closest('.btn-cross');

	if (btnClose) {
		document.querySelector('.side-bar').classList.add('sidebar-inactive');
	}
}

function controlGroupInfo(ev) {
	const allItemsPromises = [];
	const eventList = ev.target.closest('.section-list__event-info');
	const id = eventList.id;
	const idx = eventList.dataset.idx;
	const name = eventsData[idx].group.urlname;

	const groupInfoPromise = requestGroupInfo(name);
	const commentPromise = requestComments(id, name);

	allItemsPromises.push(groupInfoPromise);
	allItemsPromises.push(commentPromise);

	Promise.all(allItemsPromises)
		.then((detailedEventInfo) => {
			displayGroupInfo(detailedEventInfo[0].data);
			displayComments(detailedEventInfo[1].data);
		})
		.catch(handleError);
}

function displayGroupInfo(groupInfo) {
	const groupName = document.querySelector('.side-bar__group-info--name');
	const mainImg = document.querySelector('.side-bar__group-info--img');
	const description = document.querySelector('.side-bar__group-info--short-description');
	const albums = document.querySelectorAll('.side-bar__album--photo');

	groupName.textContent = groupInfo.name;
	mainImg.src = groupInfo.key_photo.photo_link;
	description.textContent = groupInfo.plain_text_description;

	albums.forEach((image, idx) => {
		try {
			if (groupInfo.event_sample[idx].photo_album.photo_sample[idx].photo_link) {
				image.src = groupInfo.event_sample[idx].photo_album.photo_sample[idx].photo_link;
			}
		} catch (err) {
			console.log(err);
		}

		document.querySelector('.side-bar').classList.remove('sidebar-inactive');
	});
}

function displayComments(commentInfo) {
	let commentHtmlStr = '';

	commentInfo.forEach((comment) => {
		const memberImg = comment.member.photo.thumb_link ? comment.member.photo.thumb_link : '/assets/images/default-user-image.png';

		commentHtmlStr += `
		<li class="side-bar__comment--list">
			<div class="comment-user">
				<img class="user-photo" src="${memberImg}">
				<div class="member-name">${comment.member.name}</div>
			</div>
			<div class="side-bar__comment--comment">${comment.comment}</div>
		</li>
	`;
	});

	document.querySelector('.side-bar__comment').innerHTML = commentHtmlStr;
}

function requestComments(eventId, urlName) {
	return new Promise((resolve, reject) => {
		const url = `https://api.meetup.com/${urlName}/events/${eventId}/comments?&sign=true&photo-host=public&page=20`;

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

function requestGroupInfo(urlName) {
	return new Promise((resolve, reject) => {
		const url = `https://api.meetup.com/${urlName}?&sign=true&fields=plain_text_description,event_sample`;

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

document.querySelector('.section-map__bookmark').addEventListener('click', (ev) => {
	const deleteIconEl = ev.target.closest('.btn-bookmark-delete');
	const eventId = deleteIconEl.parentElement.id;

	if (deleteIconEl) {
		const bookmarks = document.querySelectorAll('.section-map__book-clip');

		deleteBookmark(bookmarks, eventId);
	}
});

document.querySelector('.btn-bookmark').addEventListener('click', showBookmarkBar);

function showBookmarkBar(ev) {
	const bookmarkBtn = ev.target.closest('.btn-bookmark');

	if (bookmarkBtn) {
		document.querySelector('.section-map__bookmark').classList.toggle('bookmark-inactive');
	}
}

function deleteBookmark(bookmarks, eventId) {
	delete bookmarkData[eventId];

	localStorage.setItem('bookmark', JSON.stringify(bookmarkData));

	bookmarks.forEach((bookmarkedEl) => {
		if (bookmarkedEl.id === eventId) {
			bookmarkedEl.remove();
		}
	});

	document.querySelector('.bookmark-count').textContent = Object.values(bookmarkData).length;

	const isEmpty = Object.values(bookmarkData).length === 0;

	if (isEmpty) {
		document.querySelector('.bookmark-count').classList.add('inactive');
		document.querySelector('.section-map__bookmark').classList.add('bookmark-inactive');
	}

	const eventLists = document.querySelector('.section-list__container').children;

	for (let i = 0; i < eventLists.length; i++) {
		if (eventLists[i].id === eventId) {
			const iconHeartSmall = eventLists[i].children[1].children[5].children[0];

			iconHeartSmall.classList.remove('selected');
		}
	}
}

function controlLikes(ev) {
	const bookmark = ev.target.closest('.event-clip');

	if (bookmark) {
		const eventId = bookmark.parentElement.parentElement.id;
		const idx = bookmark.parentElement.parentElement.dataset.idx;
		const selectedEvent = eventsData[idx];
		const lat = selectedEvent.venue ? selectedEvent.venue.lat : selectedEvent.group.lat;
		const lng = selectedEvent.venue ? selectedEvent.venue.lon : selectedEvent.group.lon;
		const bookmarkedBefore = bookmarkData[eventId] !== undefined;
		const bookmarkIcon = bookmark.children[0];
		let bookmarkList;

		if (bookmarkedBefore) {
			const bookmarkEl = document.querySelectorAll('.section-map__book-clip');

			deleteBookmark(bookmarkEl, eventId);
		} else {
			bookmarkList = {
				eventId,
				eventName: selectedEvent.name,
				date: selectedEvent.local_date,
				img: selectedEvent.group.key_photo.highres_link,
				latLng: { lat, lng },
			};

			bookmarkData[eventId] = bookmarkList;

			localStorage.setItem('bookmark', JSON.stringify(bookmarkData));

			displayBookmarkList(bookmarkList);

			bookmarkIcon.classList.add('selected');
		}
	}
}

function displayBookmarkList(bookmark) {
	const htmlBookmarkStr = makeBookmarkEl(bookmark);

	document.querySelector('.section-map__bookmark').insertAdjacentHTML('beforeend', htmlBookmarkStr);

	document.querySelector('.bookmark-count').textContent = Object.values(bookmarkData).length;
	document.querySelector('.bookmark-count').classList.remove('inactive');
}

function makeBookmarkEl(bookmark) {
	return `
		<li class="section-map__book-clip" id="${bookmark.eventId}">
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
		const latClicked = event.latLng.lat();
		const lonClicked = event.latLng.lng();

		latLng.lat = latClicked;
		latLng.lng = lonClicked;

		controlMeetUpData();
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
		const newMarker = new google.maps.Marker({
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
		<li class="section-list__event-info" id="${eventsData[i].id}" data-idx="${i}">
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
