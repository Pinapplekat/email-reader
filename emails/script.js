var oldata = []
async function getmail(){
    const mailbox = document.getElementById("mailbox")
    var response = await fetch("/mail")
    var data = await response.json()
    if(data === oldata) return
    oldata = data
    mailbox.innerHTML = ''
    data.forEach(async (file) => {
        var fileres = await fetch(file)
        var filedata = await fileres.json()
        const fileobj = document.createElement("a")
        fileobj.href = file
        fileobj.innerText = filedata.subject
        mailbox.appendChild(fileobj)
    });
}

getmail()

setInterval(() => {
    getmail()
}, 5000)
