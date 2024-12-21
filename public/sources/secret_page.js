document.getElementById('saveButton').addEventListener('click', () => {
    const text = document.getElementById('textInput').value;
    if (text) {
        // Здесь можно добавить логику сохранения текста, например, в локальное хранилище
        fetch(`/set_storage?name=${localStorage.getItem("username")}&text=${text}`).then((response) => {
        })
    } else {
        alert('Пожалуйста, введите текст для сохранения.');
    }
});
document.getElementById("unknown").style.display = "none";

fetch(`/get_storage?name=${localStorage.getItem("username")}`).then( async (response)=>{
    if(response.status == 200) {
        let loadedText = await response.json()
        document.getElementById("textInput").value = loadedText;
    } else {
        document.getElementById("textInput").value = "failed to load text"
    }
})


