var oldata = [];
var oldReadata = [];
async function getmail() {
  getunread();
  getread();
}
getmail();
async function getunread() {
  console.log("fetching unread messages...");
  const mailbox = document.getElementById("mailbox");
  var response = await fetch("/mail");
  var data = await response.json();
  console.log("fetched unread messages")
  if (JSON.stringify(data) === JSON.stringify(oldata)) return;
  console.log("data is not same, reloading");
  oldata = data;
  mailbox.innerHTML = "";
  document.getElementById("mailboxTitle").innerHTML = "Inbox"
  document.title = `AI-mail (${data.length})`;
  document.getElementById("mailboxTitle").innerHTML =
    document.getElementById("mailboxTitle").innerHTML +
    " (" +
    data.length +
    ")";
  data.forEach(async (file) => {
    console.log(file);
    var fileres = await fetch("/mail/" + file + ".json");
    var filedata = await fileres.json();
    const fileobj = document.createElement("a");
    const aires = document.createElement("a");
    const del = document.createElement("a");
    const hr = document.createElement("hr");
    fileobj.href = "/mail/" + file;
    aires.href = `/send?ai=true&id=${file}`;
    fileobj.innerText = filedata.subject;
    aires.innerText = "Respond with AI";
    aires.className = "responsebtn";
    del.className = "responsebtn";
    del.innerText = "Mark as Read";
    del.href = `/markasread/${file}`;
    mailbox.appendChild(fileobj);
    const options = document.createElement("div")
    options.appendChild(aires);
    options.appendChild(del);
    mailbox.appendChild(options);
    mailbox.appendChild(hr);
  });
}
async function getread() {
  console.log("fetching read messages...");
  const readbox = document.getElementById("readbox");
  var readResponse = await fetch("/read");
  var readData = await readResponse.json();
  console.log("fetched read messages")
  if (JSON.stringify(readData) === JSON.stringify(oldReadata)) return console.log("Data is same");
  console.log(readData);
  oldReadata = readData;
  readbox.innerHTML = "";
  document.getElementById("readboxTitle").innerHTML = "Read"
  document.getElementById("readboxTitle").innerHTML +
    " (" +
    readData.length +
    ")";
  readData.forEach(async (file) => {
    console.log(file);
    var fileres = await fetch("/read/" + file + ".json");
    var filedata = await fileres.json();
    const fileobj = document.createElement("a");
    const aires = document.createElement("a");
    const del = document.createElement("a");
    const hr = document.createElement("hr");
    fileobj.href = "/read/" + file;
    aires.href = `/sendread?ai=true&id=${file}`;
    del.href = `/delete/${file}`;
    fileobj.innerText = filedata.subject;
    aires.innerText = "Respond with AI";
    aires.className = "responsebtn";
    del.className = "responsebtn";
    del.innerText = "Delete";
    readbox.appendChild(fileobj);
    const options = document.createElement("div")
    options.appendChild(aires);
    options.appendChild(del);
    readbox.appendChild(options);
    readbox.appendChild(hr);
  });
}

setInterval(() => {
  getmail();
}, 5000);

var accordions = document.getElementsByClassName("accordion");

for (var i = 0; i < accordions.length; i++) {
  accordions[i].onclick = function () {
    this.classList.toggle("is-open");

    var content = this.nextElementSibling;
    if (content.style.maxHeight) {
      // accordion is currently open, so close it
      content.style.maxHeight = null;
    } else {
      // accordion is currently closed, so open it
      content.style.maxHeight = content.scrollHeight + "px";
    }
  };
}
