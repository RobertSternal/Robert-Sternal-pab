
import { notStrictEqual } from "assert";
import express from "express";
import e, { Request, Response } from "express";
import { write } from "fs";
import { title } from "process";

require("dotenv").config();
const jwt = require("jsonwebtoken");


const app = express();

app.use(express.json())

app.get('/', function (req: Request, res: Response) {
  res.send('GET Hello World')
  }
)
app.post('/', function (req: Request, res: Response) {
  console.log(req.body) 
  res.status(200).send('POST Hello World')
  }
)

interface Note {
  title: string;
  content: string;
  createDate?: string;
  tags?: Tag[];
  id?: number;
  user?: string;
}

interface Login {
  login: string;
  password: string;
  id?: number;
}

interface Tag {
  id?: number;
  name: string;
  user?: string;
}


let tags: Tag[] = [];
let notatka: Note[] = [];
let users: Login[] = [
  {
    login: "admin1",
    password: "admin1"
  },
  {
    login: "admin2",
    password:"admin2"
  }
];


app.get("/users",auth,function (req, res) {
  res.send(users.filter(x => x.login === req.body.login));
  }
);

app.post("/login", async function (req, res) {
  const login = req.body.login;
  const password = req.body.password;

  let user:Login = {
    login:login,
    password:password,
    id:Date.now()
  }
    const token = jwt.sign(user,process.env.JWT_KEY)
    users.push(user);
    res.send({token:token});
  }
);

app.get("/tags", function (req, res) {
  Read();
  res.send(tags);
});
app.post("/tag",auth, async function (req:any, res) {
  await Read();
  if (req.body.name) {
    const name = req.body.name.toLowerCase();
    var a = name.toLowerCase();
    const tagFind = tags.find((name) => name.name === a);

    if (tagFind) {
      res.status(404).send("Błąd 404 tag już istnieje");
    } 
    else {
      let tag: Tag = {
        name: req.body.name,
        id: Date.now(),
        user: req.user
      };
      tags.push(tag);
      res.status(200).send(tag);
      await Write();
    }
  } else {
    res.status(404).send("Błąd 404 tag nie został utworzony");
    }
  }
);

app.delete("/tag/:id", async function (req, res) {
  await Read();
  const {id} = req.params;
  const ID = +id;
  tags = tags.filter((tag) => tag.id !== ID);
  await Write();
  res.send("Tag został usunięty");
  }
);

app.put("/tag/:id", async function (req, res) {
  await Read();
  const { id } = req.params;
  const ID = +id;
  const name = req.body.name;
  name.toLowerCase();
  const tag = tags.find((note) => note.id === ID);
  if (name) {
    tag!.name = name;
  }
  res.send(tag);
  await Write();
  }
);


app.get("/note/:id", async function (req: Request, res: Response) {
  await Read();
  const note = notatka.find((note) => note.id ===parseInt(req.params.id))

  var ID = req.params.id;
  const IDnumber = +ID;
  if(note){
    res.status(200).send(note);
  }else{
    res.status(404).send("Błąd 404");
  }
  }
);


app.get("/notes", async function (req, res) {
  await Read();
  res.send(notatka);
  }
);

app.post("/note",auth, async function (req: any, res: Response) {
  await Read();
  if (req.body.title && req.body.content) {
    let note: Note = {
      title: req.body.title,
      content: req.body.content,
      createDate: new Date().toISOString(),
      tags: req.body.tags,
      user:req.user.login,
      id: Date.now(),
    };

    let tag: Tag = {
      id: Date.now(),
      name: req.body.tags,
    };

    var idToString = note.id!.toString();

    if (tag.name === undefined) {
      tag = {
        id: Date.now(),
        name: "Default",
      };
    }

    const name = tag.name.toString().toLowerCase();
    let tagNameToLowerCase = name.toLowerCase();

    const tagFind = tags.find((x) => x.name === tagNameToLowerCase);

    if (tagFind || tagNameToLowerCase === "default") {
      notatka.push(note);
      await Write();
    } else {
      tags.push(tag);
      notatka.push(note);
      await Write();
    }
    res.status(200).send(idToString);
  } else {
    res.status(404).send("Błąd 404 nie utworzono notatki");
  }
});



app.delete("/note/:id", async (req, res) => {
  await Read();
  const {id} = req.params;
  const ID = +id;
  notatka = notatka.filter((note) => note.id !== ID);
  await Write();
  res.send("notatka z podanym id została usunięta");
});

app.put("/note/:id",async (req, res) => {
  await Read();
  const { id } = req.params;
  const ID = +id;
  const { title, content, createDate, tags } = req.body;
  const note = notatka.find((note) => note.id === ID);
  if (note == null) {
    res.status(404).send("Błąd 404 notatki nie została wyszukana");
  } else {
    function validateToken(note: any) {
      return note;
    }
    validateToken(note as any);
    if (title) {
      note!.title = title;
    }
    if (content) {
      note!.content = content;
    }
    if (createDate) {
      note!.createDate = createDate;
    }
    if (tags) {
      note!.tags = tags;
    }
    res.send(note);
    await Write();
  }
  }
);

function auth(req:any,res:any,next:any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]

  if (token==null) 
  {
    return res.sendStatus(401);
  }

  jwt.verify(token,process.env.JWT_KEY, (err:any,user:any) =>{
    if(err)
    {
      return res.sendStatus(403)
    }
    req.user = user;
    next();
  })
}

async function Write(): Promise<void> {
  var fs = require("fs");
  await  fs.writeFileSync("./data/notatka.json", JSON.stringify(notatka));
  await fs.writeFileSync("./data/tag.json", JSON.stringify(tags));
}

async function Read(): Promise<void> {

  var fs = require("fs");
  var dataNotatka = await fs.readFileSync("./data/notatka.json");
  var dataTag = await fs.readFileSync("./data/tag.json");

  notatka = JSON.parse(dataNotatka);
  tags = JSON.parse(dataTag)
}
app.listen(3000)