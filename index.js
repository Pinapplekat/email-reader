const Imap = require('imap');
const express = require("express")
var app = express()
const { simpleParser } = require('mailparser');
const fs = require("fs")
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const imapConfig = {
  user: 'elijah.ryerson@gmail.com',
  password: 'mhpt emen vzpr widp',
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
};
const getEmails = () => {
  try {
    const imap = new Imap(imapConfig);
    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        imap.search(['UNSEEN', ['SINCE', new Date()]], (err, results) => {
          if (!results || !results.length) {
            imap.end()
            return
          }
          const f = imap.fetch(results, { bodies: '' });
          f.on('message', msg => {
            msg.on('body', stream => {
              simpleParser(stream, async (err, parsed) => {
                console.log("You have mail!")
                console.log(parsed.subject)
                var timestamp = new Date()
                // const {from, subject, textAsHtml, text} = parsed;
                fs.writeFileSync(`${__dirname}/emails/raw/${parsed.subject}${timestamp}__raw.json`, JSON.stringify(parsed))
                fs.writeFileSync(`${__dirname}/emails/html/${parsed.subject}${timestamp}__body.html`, JSON.stringify(parsed.html))
                /* Make API call to save the data
                   Save the retrieved data into a database.
                   E.t.c
                */
              });
            });
            msg.once('attributes', attrs => {
              const { uid } = attrs;
              imap.addFlags(uid, ['\\Seen'], () => {
                // Mark the email as read after reading it
                console.log('New e-mail marked as read!');
              });
            });
          });
          f.once('error', ex => {
            return Promise.reject(ex);
          });
          f.once('end', () => {
            console.log('Done fetching all messages!');
            imap.end();
          });
        });
      });
    });

    imap.once('error', err => {
      console.log(err);
    });

    imap.once('end', () => {
      // console.log('Connection ended');
    });

    imap.connect();
  } catch (ex) {
    console.log('an error occurred');
  }
};
getEmails()
setInterval(() => {
  try {
    getEmails()
  } catch (e) {
    console.log(e)
  }

}, s(5))
// getEmails()

function s(int) {
  return int * 1000
}
app.use(express.static('emails'))
app.get("/", (req,res) => {
  res.sendFile(__dirname+"/html/index.html")
})

app.get("/mail", (req,res) => {
  console.log("requested email data")
  var filedirs = []
  fs.readdir(__dirname+"/emails/raw", (err, files) => {
    files.forEach(file => {
      file = "/raw/"+file
      filedirs.push(file)
    });
    res.json(filedirs)
  });
})
app.listen(8080, (e) => {
  if(e) throw new Error(e)
  console.log("app started port 8080")
})