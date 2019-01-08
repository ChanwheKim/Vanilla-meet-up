// Load application styles
import 'styles/index.scss';

// ================================
// START YOUR APP HERE
// ================================

// You can use jquery for ajax request purpose only.
import $ from 'jquery';

let eventsData = [];
let bookmarkData = {};
const cityInfo = {};
const location = {};
let topicData = [];
let map;
let topicCategory = '';

window.onload = function initializeApp() {
	bookmarkData = JSON.parse(localStorage.getItem('bookmark'));

	Object.values(bookmarkData).forEach((bookmark) => {
		displayBookmarkList(bookmark);
	});

	setupEventListener();

	initializeMap();
};

function setupEventListener() {
	document.querySelector('.btn-cross').addEventListener('click', hideSidebar);

	document.querySelector('.section-list__container').addEventListener('click', (ev) => {
		if (ev.target.closest('.icon-bookmark')) {
			controlBookmark(ev);
		} else if (ev.target.closest('.section-list__event-details')) {
			controlGroupInfo(ev);
		}
	});

	document.querySelector('.section-map__bookmark').addEventListener('click', (ev) => {
		const bookmarkDelete = ev.target.closest('.btn-bookmark-delete');
		const eventId = bookmarkDelete.parentElement.id;

		if (bookmarkDelete) {
			const bookmarks = document.querySelectorAll('.section-map__bookmark--list');

			eventsData.length = 0;

			deleteBookmark(bookmarks, eventId);
		}
	});

	document.querySelector('.btn-bookmark').addEventListener('click', displayBookmarkBar);

	document.querySelector('.section-topic__wrapper').addEventListener('click', (ev) => {
		const topicItem = ev.target.closest('.section-topic__wrapper--topic');

		if (topicItem) {
			topicCategory = topicItem.id;

			controlMeetUpData();
		}
	});

	document.querySelector('.section-topic__wrapper').addEventListener('mousedown', dragElement);
}

function hideSidebar(ev) {
	const btnClose = ev.target.closest('.btn-cross');

	if (btnClose) {
		document.querySelector('.side-bar').classList.add('sidebar-inactive');
	}
}

function controlGroupInfo(ev) {
	const allDataPromises = [];
	const eventList = ev.target.closest('.section-list__event-info');
	const eventId = eventList.id;
	const idx = eventList.dataset.idx;
	const groupName = eventsData[idx].group.urlname;

	const groupInfoPromise = requestGroupInfo(groupName);
	const commentPromise = requestComments(eventId, groupName);

	allDataPromises.push(groupInfoPromise);
	allDataPromises.push(commentPromise);

	Promise.all(allDataPromises)
		.then((detailedEventInfo) => {
			displayGroupInfo(detailedEventInfo[0].data);
			displayComments(detailedEventInfo[1].data);
		})
		.catch(handleError);
}

function displayGroupInfo(groupInfo) {
	const groupNameEl = document.querySelector('.side-bar__group-info--name');
	const mainImgEl = document.querySelector('.side-bar__group-info--img');
	const descriptionEl = document.querySelector('.side-bar__group-info--short-description');
	const albumsEls = document.querySelectorAll('.side-bar__album--photo');

	groupNameEl.textContent = groupInfo.name;
	mainImgEl.src = groupInfo.key_photo.photo_link;
	descriptionEl.textContent = groupInfo.plain_text_description;

	albumsEls.forEach((image, idx) => {
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

function displayBookmarkBar(ev) {
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

function controlBookmark(ev) {
	const bookmark = ev.target.closest('.icon-bookmark');

	if (bookmark) {
		const eventId = bookmark.parentElement.parentElement.id;
		const idx = bookmark.parentElement.parentElement.dataset.idx;
		const eventData = eventsData[idx];
		const lat = eventData.venue ? eventData.venue.lat : eventData.group.lat;
		const lng = eventData.venue ? eventData.venue.lon : eventData.group.lon;
		const hasBookmark = bookmarkData[eventId] !== undefined;
		const bookmarkIcon = bookmark.children[0];
		let bookmarkInfo;

		if (hasBookmark) {
			const bookmarksEl = document.querySelectorAll('.section-map__bookmark--list');

			deleteBookmark(bookmarksEl, eventId);
		} else {
			bookmarkInfo = {
				eventId,
				eventName: eventData.name,
				date: eventData.local_date,
				img: eventData.group.key_photo.highres_link,
				latLng: { lat, lng },
			};

			bookmarkData[eventId] = bookmarkInfo;

			localStorage.setItem('bookmark', JSON.stringify(bookmarkData));

			displayBookmarkList(bookmarkInfo);

			bookmarkIcon.classList.add('selected');
		}
	}
}

function displayBookmarkList(bookmark) {
	const htmlBookmarkStr = makeBookmarkHtml(bookmark);

	document.querySelector('.section-map__bookmark').insertAdjacentHTML('beforeend', htmlBookmarkStr);

	document.querySelector('.bookmark-count').textContent = Object.values(bookmarkData).length;
	document.querySelector('.bookmark-count').classList.remove('inactive');
}

function makeBookmarkHtml(bookmark) {
	return `
		<li class="section-map__bookmark--list" id="${bookmark.eventId}">
			<img class="section-map__bookmark--img" src="${bookmark.img}">
			<div class="bookmark--info">
					<div class="section-map__event-name">${bookmark.eventName}</div>
					<div class="section-map__bookmark--date">${bookmark.date}</div>
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

function initializeMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: { lat: 37.773972, lng: -122.431297 },
		zoom: 13,
	});

	const input = document.querySelector('.map__input');
	const searchBox = new google.maps.places.SearchBox(input);

	searchBox.addListener('places_changed', () => {
		location.lat = searchBox.getPlaces()[0].geometry.location.lat();
		location.lng = searchBox.getPlaces()[0].geometry.location.lng();

		cityInfo.photoUrl = searchBox.getPlaces()[0].photos[0].getUrl();
		cityInfo.name = searchBox.getPlaces()[0].name;

		controlMeetUpData();
	});

	google.maps.event.addListener(map, 'click', (event) => {
		const latClicked = event.latLng.lat();
		const lonClicked = event.latLng.lng();

		location.lat = latClicked;
		location.lng = lonClicked;

		controlMeetUpData();
	});
}

function controlMeetUpData() {
	const allDataPromises = [];
	const meetUpPromise = requestMeetUpLists();
	const topicPromise = requestTopics();

	allDataPromises.push(meetUpPromise);
	allDataPromises.push(topicPromise);

	Promise.all(allDataPromises)
		.then(saveUpcomingEvents)
		.then(changeMapView)
		.then(displayTopic)
		.then(displayEventsOnMap)
		.then(displayLists)
		.then(displayCityInfo)
		.catch(handleError)
}

function requestMeetUpLists() {
	return new Promise((resolve, reject) => {
		const url = `https://api.meetup.com/find/upcoming_events?&sign=true&lat=${location.lat}&lon=${location.lng}2&key=d1f4549d314392d4b48651c3e4a&fields=event_hosts,comment_count,group_key_photo&page=20&topic_category=${topicCategory}`;

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
	})
		.finally(() => {
			topicCategory = '';
		});
}

function requestTopics() {
	return new Promise((resolve, reject) => {
		const url = `https://api.meetup.com/find/topic_categories?&sign=true&photo-host=public&lon=${location.lng}&lat=${location.lat}`;

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

function changeMapView() {
	map.setCenter(location);
}

function displayTopic() {
	const topics = topicData.slice();

	document.querySelector('.section-topic__wrapper').innerHTML = '';

	while (topics.length) {
		const topic = topics.splice(Math.floor(Math.random() * topics.length), 1)[0];

		const topicListEl = document.createElement('li');
		const topicImageEl = document.createElement('div');
		const topicLabelEl = document.createElement('div');

		topicImageEl.className = 'section-topic__img';
		topicImageEl.style.backgroundImage = `linear-gradient(to right, rgba(0,0,0,.5), rgba(0,0,0,.5)), url(${topic.photo.photo_link})`;

		topicLabelEl.className = 'section-topic__name';
		topicLabelEl.textContent = topic.name;

		topicListEl.className = 'section-topic__wrapper--topic';
		topicListEl.id = topic.id;
		topicListEl.appendChild(topicImageEl);
		topicListEl.appendChild(topicLabelEl);

		document.querySelector('.section-topic__wrapper').appendChild(topicListEl);
	}
}

function displayCityInfo() {
	const cityPhotoEl = document.querySelector('.section-city__img');
	const cityNameEl = document.querySelector('.section-city__city-name');
	const memberCountEl = document.querySelector('.section-city__city-member');

	cityPhotoEl.src = cityInfo.photoUrl;

	cityNameEl.textContent = cityInfo.name;

	memberCountEl.textContent = `Total :  ${cityInfo.memberCount} members`;

	document.querySelector('.section-city').classList.remove('inactive');
}

function saveUpcomingEvents(response) {
	eventsData = response[0].data.events;
	topicData = response[1].data;
	cityInfo.memberCount = formatNumber(response[0].data.city.member_count);
}

function displayEventsOnMap() {
	for (let i = 0; i < eventsData.length; i++) {
		const lat = eventsData[i].venue ? eventsData[i].venue.lat : eventsData[i].group.lat;
		const lng = eventsData[i].venue ? eventsData[i].venue.lon : eventsData[i].group.lon;

		const contentString = `
			<img src="${eventsData[i].group.key_photo.thumb_link}">
			<div>${eventsData[i].name}</div>
		`;

		const infoWindow = new google.maps.InfoWindow({
			content: contentString,
			maxWidth: 250,
		});

		const newMarker = new google.maps.Marker({
			position: {
				lat,
				lng,
			},
			map,
		});

		newMarker.addListener('mouseover', () => {
			infoWindow.open(map, newMarker);
		});

		newMarker.addListener('mouseout', () => {
			infoWindow.close();
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
					<div class="icon icon-bookmark">
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

	document.querySelector('.section-list__container').innerHTML = lists;
}

function formatNumber(number) {
	const member = number.toString().split('');
	let result = '';
	let count = 0;
	let limit = 4;

	return member.reduceRight((acc, cur) => {
		count++;

		if (count === limit) {
			result = cur + ',' + acc;
			count = 0;
			limit = 3;
		} else {
			result = cur + acc;
		}

		return result;
	}, result);
}

function convertCreatedTime(milliSec) {
	const created = (milliSec) / (1000 * 60 * 60);
	const now = new Date() / (1000 * 60 * 60);
	let timeElapsed = parseInt(now - created);
	let timeLable;

	if (timeElapsed >= 24) {
		timeElapsed = parseInt(timeElapsed % 24);
		timeLable = timeElapsed === 1 ? `${timeElapsed} day ago` : `${timeElapsed} days ago`;
	} else {
		timeLable = timeLable === 1 ? `${timeElapsed} hour ago` : `${timeElapsed} hours ago`;
	}

	return timeLable;
}

function handleError(err) {
	alert('Something went wrong. Could you try it again?');
	console.log(err);
}

function dragElement(ev) {
	const topicEl = document.querySelector('.section-topic__wrapper');
	let position1 = 0;
	let position2 = 0;

	topicEl.onmousedown = dragMouseDown;

	function dragMouseDown(ev) {
		position2 = ev.clientX;

		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;
	}

	function elementDrag(ev) {
		position1 = position2 - ev.clientX;
		position2 = ev.clientX;

		topicEl.style.left = (topicEl.offsetLeft - position1) + 'px';
	}

	function closeDragElement() {
		document.onmouseup = null;
		document.onmousemove = null;
	}
}
