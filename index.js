const Imap = require("imap");
require("dotenv").config();
const express = require("express");
var app = express();
const { simpleParser } = require("mailparser");
const nodemailer = require("nodemailer");
const fs = require("fs");
const { parse } = require("path");
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  organization: "org-YXSSvW9dNNalFFgCdmmfpyB6",
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const imapConfig = {
  user: process.env.GMAIL,
  password: process.env.GPASS,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
};
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL, // generated ethereal user
    pass: process.env.GPASS, // generated ethereal password
  },
});
const getEmails = () => {
  try {
    const imap = new Imap(imapConfig);
    imap.once("ready", () => {
      imap.openBox("INBOX", false, () => {
        imap.search(["UNSEEN", ["SINCE", new Date()]], (err, results) => {
          if (!results || !results.length) {
            imap.end();
            return;
          }
          const f = imap.fetch(results, { bodies: "" });
          f.on("message", (msg) => {
            msg.on("body", (stream) => {
              simpleParser(stream, async (err, parsed) => {
                console.log("You have mail!");
                console.log(parsed.subject);
                var msgid = Date.now();
                // const {from, subject, textAsHtml, text} = parsed;
                fs.writeFileSync(
                  `${__dirname}\\emails\\mail\\${msgid}.json`,
                  JSON.stringify(parsed)
                );
                /* Make API call to save the data
                   Save the retrieved data into a database.
                   E.t.c
                */
              });
            });
            msg.once("attributes", (attrs) => {
              const { uid } = attrs;
              imap.addFlags(uid, ['\\Seen'], () => {
                console.log('New e-mail marked as read!');
              });
            });
          });
          f.once("error", (ex) => {
            return Promise.reject(ex);
          });
          f.once("end", () => {
            console.log("Done fetching all messages!");
            imap.end();
          });
        });
      });
    });

    imap.once("error", (err) => {
      console.log(err);
    });

    imap.once("end", () => {
      // console.log('Connection ended');
    });

    imap.connect();
  } catch (ex) {
    console.log("an error occurred");
  }
};
getEmails();
setInterval(() => {
  try {
    getEmails();
  } catch (e) {
    console.log(e);
  }
}, s(5));
// getEmails()

function s(int) {
  return int * 1000;
}
app.use(express.static("emails"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.get("/mail/:id", (req, res) => {
  var { id } = req.params;
  var maildata = fs.readFileSync(__dirname + "/emails/mail/" + id + ".json");
  maildata = JSON.parse(maildata);
  if(maildata.html) return res.send(maildata.html);
  res.send(maildata.text);
  
});
app.get("/mail", (req, res) => {
  var filedirs = [];
  fs.readdir(__dirname + "/emails/mail", (err, files) => {
    files.forEach((file) => {
      file = file.split(".json")[0];
      filedirs.push(file);
    });
    res.json(filedirs);
  });
});
app.get("/send", (req, res) => {
  var { ai, user, message, id } = req.query;
  if(id){
    var maildata = fs.readFileSync(__dirname + "/emails/mail/" + id + ".json");
    maildata = JSON.parse(maildata);
    if (ai == "true") {
      autoMessage(maildata.from.value[0], maildata.text, res, maildata.messageId, maildata);
    }
  }
  
});
async function autoMessage(user, emailtext, res, reply, otherdata) {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant that is tasked with responding to an email sent to Elijah Ryerson. Your name is Pinapplekat, please remember that. In summary, you are a character name Pinapplekat that is tasked with replying to Elijah Ryerson's EMAIL.`,
      },
      {
        role: "user",
        content: `New email to respond to the subject is "${otherdata.subject}", from ${user.name}: \n ${emailtext}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  console.log(response.data.choices[0].message)
  let info = await transporter.sendMail({
    from: '"Pinapplekat (AI Assistant)" <elijah.ryerson@gmail.com>', // sender address
    to: user.address, // list of receivers
    headers: {
      inReplyTo: user.address,
      messageId: reply
    },
    subject: "Response", // Subject line
    text: response.data.choices[0].message.content, // plain text body
  });
  res.redirect(nodemailer.getTestMessageUrl(info))
}
app.listen(8080, (e) => {
  if (e) throw new Error(e);
  console.log("app started port 8080");
});
