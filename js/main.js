"use strict"

// Элементы с изменяемым содержимым/атрибутами
const app = {
	main: document.querySelector("main"),
	front: document.querySelector(".front"),
	editor: document.querySelector(".editor"),
	article: document.querySelector(".article"),
	loading_screen: document.querySelector(".loading_screen")
}

// Отобразить главную страницу
async function display_front_page() {
	display_loading_screen()

	const { titles } = await sendRequest("get_all_titles")

	app.front.replaceChildren()

	for (let obj of titles) {
		const {id, title, head} = obj
		const card = build_card(id, title, head)

		app.front.append(card)
	}

	app.front.append(build_new_post_card())

	app.main.classList.remove("two-panel")
	app.front.classList.remove("hide")
	app.editor.classList.add("hide")
	app.article.classList.add("hide")
	app.loading_screen.classList.add("hide")
}

// Отобразить публикацию
async function display_article(id) {
	display_loading_screen()

	const { post } = await sendRequest("get_post", {id})
	const controls = build_post_control_panel(post)
	const article = document.createElement("div")
	const title = document.createElement("h1")
	const content = document.createElement("div")

	title.innerHTML = post.title
	content.innerHTML = marked.parse(post.content)

	article.append(title, content)

	app.article.replaceChildren(controls, article)

	app.main.classList.remove("two-panel")
	app.front.classList.add("hide")
	app.editor.classList.add("hide")
	app.article.classList.remove("hide")
	app.loading_screen.classList.add("hide")
}

// Отобразить редактор
async function display_editor(id) {
	display_loading_screen()

	const { post } = await sendRequest("get_post", {id})
	const titlebox = document.createElement("input")
	const textarea = document.createElement("textarea")
	const preview_label = build_preview_hint_panel()
	const preview = document.createElement("div")
	const title = document.createElement("h1")
	const content = document.createElement("div")

	titlebox.type = "text"
	titlebox.value = post.title
	textarea.value = post.content
	title.innerHTML = post.title
	content.innerHTML = marked.parse(post.content)

	preview.append(title, content)

	titlebox.oninput = function(event) {
		title.innerHTML = titlebox.value
	}

	textarea.oninput = function(event) {
		content.innerHTML = marked.parse(textarea.value)
	}

	const save_fn = async function() {
		const content = textarea.value
		const title = titlebox.value
		const id = post.id

		display_loading_screen()

		if (title != post.title) {
			const response = await sendRequest('change_title', { id, title } )
		}

		if (content != post.content) {
			const response = await sendRequest('change_content', { id, content } )
		}

		display_article(id)
	}

	const controls = build_editor_control_panel(post, save_fn)

	app.editor.replaceChildren(controls, titlebox, textarea)
	app.article.replaceChildren(preview_label, preview)

	app.main.classList.add("two-panel")
	app.front.classList.add("hide")
	app.editor.classList.remove("hide")
	app.article.classList.remove("hide")
	app.loading_screen.classList.add("hide")
}

async function display_loading_screen() {
	app.main.classList.remove("two-panel")
	app.front.classList.add("hide")
	app.editor.classList.add("hide")
	app.article.classList.add("hide")
	app.loading_screen.classList.remove("hide")
}

// ============================================================================
// Функции для генерации элементов
// ============================================================================

// Карточка для главной страницы
function build_card(id, title, head) {
	const card = document.createElement("div")
	const html_head = marked.parse(head ?? "")

	card.innerHTML = `<div><h1>${title}</h1><div>${html_head}</div></div><div class="fade"></div><icon big class="arrow">arrow_right_alt</icon>`
	card.onclick = function(event) {
		display_article(id)
	}

	return card
}

// Карточка для создания нового поста
function build_new_post_card() {
	const card = document.createElement("div")

	card.innerHTML = `<div><icon big>add</icon><div>Добавить</div></div>`
	card.onclick = async function(event) {
		display_loading_screen()
		const { id } = await sendRequest('add_new_post', {title: "New post"})
		display_editor(id)
	}

	card.classList.add("add-card")

	return card
}

// Панель с подписью и кнопками
function build_panel(_label, _elems = []) {
	const panel = document.createElement("div")
	const label = document.createElement("div")
	const elems = document.createElement("div")

	panel.classList.add("controls")
	label.classList.add("label")
	elems.classList.add("elems")

	label.innerHTML = _label
	
	for (let elem of _elems)
		elems.append(elem)

	panel.append(label)
	panel.append(elems)

	return panel
}

// Панель с кнопками публикации/скрытия + редактирования + удаления
function build_post_control_panel(post) {
	const unhide = document.createElement("button")
	const hide = document.createElement("button")
	const edit = document.createElement("button")
	const del = document.createElement("button")

	unhide.onlick = function() {
		unhide_article(post.id)
		display_article(post.id) // Спровоцировать обновление панели управления
	}

	hide.onlick = function() {
		hide_article(post.id)
		display_article(post.id)
	}

	edit.onclick = function() {
		display_editor(post.id)
	}

	del.onclick = async function() {
		const id = post.id

		if (confirm("Точно удалить?")) {
			display_loading_screen()
			const response = await sendRequest('delete_post', { id } )
			display_front_page()
		}
	}

	unhide.innerHTML = `<icon>visibility</icon><span>Опубликовать</span>`

	hide.innerHTML = `<icon>visibility_off</icon><span>Спрятать</span>`
	edit.innerHTML = `<icon>edit</icon><span>Редактировать</span>`
	del.innerHTML = `<icon>delete</icon><span>Удалить</span>`

	return build_panel("Управление", [hide, edit, del])
}

// Панель с кнопками отмены + сохранения
function build_editor_control_panel(post, save_fn) {
	const abort = document.createElement("button")
	const save = document.createElement("button")

	abort.onclick = function() {
		display_article(post.id)
	}

	save.onclick = save_fn

	abort.innerHTML = `<icon>close</icon><span>Отмена</span>`
	save.innerHTML = `<icon>done</icon><span>Сохранить</span>`

	return build_panel("Режим редактирования", [abort, save])
}

// Панель с надписью "Предпросмотр"
function build_preview_hint_panel() {
	return build_panel("Предпросмотр")
}

display_front_page()

// fetch("https://functions.yandexcloud.net/d4ekq68eemul40pdvpc9", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "ru,en;q=0.9",
//     "content-type": "text/plain;charset=UTF-8",
//     "sec-ch-ua": "\"Chromium\";v=\"110\", \"Not A(Brand\";v=\"24\", \"YaBrowser\";v=\"23\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Windows\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "cross-site"
//   },
//   "referrerPolicy": "strict-origin-when-cross-origin",
//   "body": "{\"status\":\"ok\",\"cards\":[{\"count\":1,\"color\":2,\"shape\":3,\"fill\":2},{\"count\":2,\"color\":2,\"shape\":3,\"fill\":3},{\"count\":2,\"color\":3,\"shape\":2,\"fill\":3},{\"count\":1,\"color\":2,\"shape\":2,\"fill\":3},{\"count\":3,\"color\":2,\"shape\":2,\"fill\":2},{\"count\":3,\"color\":1,\"shape\":3,\"fill\":3},{\"count\":1,\"color\":1,\"shape\":2,\"fill\":3},{\"count\":2,\"color\":3,\"shape\":2,\"fill\":2},{\"count\":2,\"color\":1,\"shape\":1,\"fill\":1},{\"count\":2,\"color\":2,\"shape\":1,\"fill\":3},{\"count\":3,\"color\":3,\"shape\":1,\"fill\":1},{\"count\":2,\"color\":1,\"shape\":1,\"fill\":3}]}",
//   "method": "POST",
//   "mode": "cors",
//   "credentials": "omit"
// }).then(response => response.text())
//   .then(result => console.log(result))
//   .catch(error => console.log('error', error));
