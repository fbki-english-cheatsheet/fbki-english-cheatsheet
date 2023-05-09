async function sendRequest(action, params = {}) {
	const url = 'https://functions.yandexcloud.net/d4e6j4uk5pp88r9ekg4r';

	const requestOptions = {
		method: 'POST',
		body: JSON.stringify({ action, ...params, token: "12345token" }),
	};

	let response, obj;

	try {
		response = await fetch(url, requestOptions);
	} catch(exception) {
		console.log("Network error");
	}

	if (response.status != 200) {
		console.log("Server error", response);
	}

	try {
		obj = await response.json();
	} catch (exception) {
		console.log("Malformed JSON from server", exception);
	}

	return obj;
}

/*
// get all titles
sendRequest('get_all_titles', {}, data => console.log(data));

// add new post
sendRequest('add_new_post', { title: 'New Post Title', content: 'New Post Content' }, data => console.log(data));

// get post
sendRequest('get_post', { id: 1 }, data => console.log(data));

// change title
sendRequest('change_title', { id: 1, title: 'New Title' }, data => console.log(data));

// change content
sendRequest('change_content', { id: 1, content: 'New Content' }, data => console.log(data));

// delete post
sendRequest('delete_post', { id: 1 }, data => console.log(data));
*/
