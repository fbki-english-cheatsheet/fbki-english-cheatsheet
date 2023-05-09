class ShitDB{
	constructor(function_id){
		this.link = "https://functions.yandexcloud.net/"+function_id
	}

	request(obj, callback){
		fetch(this.link, {
			method: 'POST',
			body: JSON.stringify(obj),
		})
			.then(response => response.json())
			.then(json => callback(json))
	}

	get_all_ids(callback){
		
	}

}

console.log("hi")
db = new ShitDB("d4ekq68eemul40pdvpc9")
data = {"status": "ok", "cards": [{"count": 1, "color": 2, "shape": 3, "fill": 2}, {"count": 2, "color": 2, "shape": 3, "fill": 3}, {"count": 2, "color": 3, "shape": 2, "fill": 3}, {"count": 1, "color": 2, "shape": 2, "fill": 3}, {"count": 3, "color": 2, "shape": 2, "fill": 2}, {"count": 3, "color": 1, "shape": 3, "fill": 3}, {"count": 1, "color": 1, "shape": 2, "fill": 3}, {"count": 2, "color": 3, "shape": 2, "fill": 2}, {"count": 2, "color": 1, "shape": 1, "fill": 1}, {"count": 2, "color": 2, "shape": 1, "fill": 3}, {"count": 3, "color": 3, "shape": 1, "fill": 1}, {"count": 2, "color": 1, "shape": 1, "fill": 3}]}
db.request(data,(json)=>console.log(json))


