var oldata = []
async function getmail(){
    const mailbox = document.getElementById("mailbox")
    var response = await fetch("/mail") 
    var data = await response.json()
    if(JSON.stringify(data) === JSON.stringify(oldata)) return
    console.log("data is not same, reloading")
    oldata = data
    mailbox.innerHTML = ''
    data.forEach(async (file) => {
        var fileres = await fetch("/mail/"+file+".json")
        var filedata = await fileres.json()
        const fileobj = document.createElement("a")
        const aires = document.createElement("a")
        const hr = document.createElement("hr")
        fileobj.href = "/mail/"+file
        aires.href = `/send?ai=true&id=${file}`
        fileobj.innerText = filedata.subject
        aires.innerText = 'Respond with AI'
        mailbox.appendChild(fileobj)
        mailbox.appendChild(aires)
        mailbox.appendChild(hr)
    });
}

getmail()

setInterval(() => {
    getmail()
}, 5000)
