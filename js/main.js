"use strict"

// Конфигурация для Marked
// Здесь включена опция breaks, которая включает вставку <br> заместо \n при переносах внутри абзаца и др.
marked.setOptions({
	"async": false,
	"baseUrl": null,
	"breaks": true,
	"extensions": null,
	"gfm": true,
	"headerIds": false,
	"headerPrefix": "",
	"highlight": null,
	"hooks": null,
	"langPrefix": "language-",
	"mangle": false,
	"pedantic": false,
	"sanitize": false,
	"sanitizer": null,
	"silent": false,
	"smartypants": false,
	"tokenizer": null,
	"walkTokens": null,
	"xhtml": false
})

// Marked всё равно будет вставлять \n в странные места, например после <ol>
// Это плохо сочетается с white-space: pre-wrap
// Здесь мы избавляемся от этих лишних \n
function parse(x) {
	return marked.parse(x).replace(/\n/g, "")
}

// Элементы с изменяемым содержимым/атрибутами
const app = {
	main: document.querySelector("main"),
	front: document.querySelector(".front"),
	editor: document.querySelector(".editor"),
	article: document.querySelector(".article"),
	auth_menu: document.querySelector(".auth-menu"),
	loading_screen: document.querySelector(".loading_screen")
}

const auth = {
	username: "",
	token: ""
}

async function perform_sign_in(form, username, password) {
	const results = await sendRequest('login', { name: username, password: password })
	
	if (results.success == false) {
		alert("Неверный логин или пароль")
		return
	} else {
		auth.username = username
		auth.token = results.token

		display_sign_out_form()
		display_front_page()
	}
}

async function perform_sign_out() {
	auth.username = ""
	auth.token = ""
}

// Отобразить форму авторизации в меню авторизации
async function display_sign_in_form() {
	const form = document.createElement("form")

	form.onsubmit = function(event) {
		const username = form.username.value
		const password = form.password.value

		perform_sign_in(form, username, password)

		return false
	}

	form.innerHTML = `
	<div>
		<div>Имя учетной записи:</div>
		<input type="text" name="username">
	</div>
	<div>
		<div>Пароль:</div>
		<input type="password" name="password">
	</div>
	<div>
		<input type="submit" value="Войти">
	</div>`

	app.auth_menu.replaceChildren(form)
}

async function display_sign_out_form() {
	const form = document.createElement("form")

	form.onsubmit = function(event) {
		perform_sign_out()

		display_sign_in_form()
		display_front_page()

		return false
	}

	form.innerHTML = `
	<div>
		Вы вошли как: ${auth.username}
	</div>
	<div>
		<input type="submit" value="Выйти">
	</div>`

	app.auth_menu.replaceChildren(form)
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

	if (auth.token)
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
	content.innerHTML = parse(post.content)
	content.classList.add("markdown")

	article.append(title, content)

	if (auth.token) {
		app.article.replaceChildren(controls, article)
	} else {
		app.article.replaceChildren(article)
	}

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
	content.innerHTML = parse(post.content)
	content.classList.add("markdown")

	preview.append(title, content)

	titlebox.oninput = function(event) {
		title.innerHTML = titlebox.value
	}

	textarea.oninput = function(event) {
		content.innerHTML = parse(textarea.value)
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
	const html_head = parse(head ?? "")

	card.innerHTML = `<div><h1>${title}</h1><div class="markdown">${html_head}</div></div><div class="fade"></div><icon big class="arrow">arrow_right_alt</icon>`
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

display_sign_in_form()
display_front_page()
