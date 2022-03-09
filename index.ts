const express = require('express')
 const app = express()
  app.get('/', function (req, res) { res.send('Hello World') })
   app.listen(3000)

app.get('/', function (req, bdd) { bdd.send("Kalkulator" )})

   